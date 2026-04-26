import { HearingMessage } from '@/types/hearing';
import { generateText } from '@/lib/gemini';

function formatUserExchanges(messages: HearingMessage[]): string
{
	const lines = messages
		.filter(m => m.speaker_id === 'user' || m.speaker_id === 'opposing_counsel')
		.map(m => `${m.speaker}: ${m.content}`);
	return lines.length ? lines.join('\n') : 'No prior exchanges.';
}

export async function argue(
	caseName: string,
	caseSummary: string,
	brief: string,
	side: string,
	userMessages: HearingMessage[]
): Promise<string>
{
	const opposingSide = side === 'plaintiff' ? 'respondent' : 'petitioner';
	const exchanges = formatUserExchanges(userMessages);
	const prompt = `You are a skilled appellate attorney arguing as the ${opposingSide} in ${caseName}.
Case background: ${caseSummary}
Your opponent has argued:
${brief}
During questioning, the opponent said:
${exchanges}
Deliver your oral argument. In 3-4 sentences, make the strongest counter-argument to their position. Reference specific weaknesses that emerged during their questioning. Be direct, confident, and legally precise. Do not introduce yourself — begin arguing immediately.`;
	return generateText(prompt);
}

export async function respondToQuestion(
	question: string,
	caseName: string,
	caseSummary: string,
	side: string
): Promise<string>
{
	const opposingSide = side === 'plaintiff' ? 'respondent' : 'petitioner';
	const prompt = `You are a skilled appellate attorney arguing as the ${opposingSide} in ${caseName}.
Case background: ${caseSummary}
A Justice has asked you:
"${question}"
Respond directly and persuasively in 2-3 sentences. Stay in character as appellate counsel.`;
	return generateText(prompt);
}
