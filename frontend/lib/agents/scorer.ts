import { HearingMessage, HearingScores } from '@/types/hearing';
import { generateText } from '@/lib/gemini';

const FALLBACK: HearingScores = { consistency: 50, precedent: 50, responsiveness: 50, overall: 50 };

export async function evaluate(
	brief: string,
	allMessages: HearingMessage[],
	side: string
): Promise<HearingScores>
{
	const history = allMessages.map(m => `${m.speaker}: ${m.content}`).join('\n');
	const party = side === 'plaintiff' ? 'petitioner' : 'respondent';
	const prompt = `You are a Supreme Court law clerk evaluating an attorney's oral argument performance.
The attorney argued as the ${party}.
Their submitted brief:
${brief}
Full argument transcript:
${history}
Score the attorney's performance from 0 to 100 on each dimension:
- consistency: Did the attorney stay consistent with their brief, or did they contradict themselves? (0 = many contradictions, 100 = fully consistent)
- precedent: Did the attorney demonstrate knowledge of and respect for relevant case law and stare decisis? (0 = ignored precedent, 100 = excellent citation and application of precedent)
- responsiveness: Did the attorney actually answer the justices' questions, or did they pivot and dodge? (0 = complete evasion, 100 = directly and fully responsive)
Return ONLY valid JSON in this exact format:
{"consistency": <number>, "precedent": <number>, "responsiveness": <number>}`;

	try
	{
		let raw = (await generateText(prompt)).trim();
		if(raw.startsWith('```'))
		{
			const parts = raw.split('```');
			raw = parts[1] ?? '';
			if(raw.startsWith('json')) raw = raw.slice(4);
		}
		const data = JSON.parse(raw.trim());
		const consistency: number = data.consistency ?? 50;
		const precedent: number = data.precedent ?? 50;
		const responsiveness: number = data.responsiveness ?? 50;
		const overall = Math.round(consistency * 0.3 + precedent * 0.3 + responsiveness * 0.4);
		return { consistency, precedent, responsiveness, overall };
	}
	catch
	{
		return FALLBACK;
	}
}
