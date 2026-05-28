import { JudgeConfig, HearingMessage, JudgeVote } from '@/types/hearing';
import { generateText } from '@/lib/gemini';

const formatHistory = (messages: HearingMessage[]): string =>
{
	if(!messages.length) return 'No exchanges yet.';
	return messages.map(m => `${m.speaker}: ${m.content}`).join('\n');
};

export const askQuestion = async (
	judge: JudgeConfig,
	caseName: string,
	caseSummary: string,
	brief: string,
	side: string,
	conversationHistory: HearingMessage[]
): Promise<string> =>
{
	const history = formatHistory(conversationHistory);
	const role = side === 'plaintiff' ? 'petitioner (plaintiff)' : 'respondent (defendant)';
	const prompt = `${judge.system_prompt}

You are presiding over oral arguments in ${caseName}.

Case background: ${caseSummary}

The attorney is arguing as the ${role}.

Their submitted brief:
${brief}

Conversation so far:
${history}

Ask a single, pointed oral argument question that challenges the attorney based on your judicial philosophy. Be direct, skeptical, and specific to their argument. Do not preface the question — ask it immediately as you would from the bench. One question only.`;
	return generateText(prompt);
};

export const scoreResponse = async (
	judge: JudgeConfig,
	question: string,
	userResponse: string,
	brief: string
): Promise<number> =>
{
	const prompt = `${judge.system_prompt}

You asked the following question during oral argument:
"${question}"

The attorney responded:
"${userResponse}"

Their original brief position:
${brief}

From your judicial philosophy's perspective, evaluate how well the attorney answered your question. Consider:
- Did they directly answer what was asked?
- Was the answer grounded in the kind of reasoning you value?
- Did they stay consistent with their brief?

Return ONLY a single integer from -2 to 2:
-2 = poor answer, dodged the question or contradicted themselves
-1 = weak answer, partially addressed it
 0 = neutral or unclear
+1 = good answer, responsive and reasoned
+2 = excellent answer, directly addressed your concerns with strong reasoning

Return nothing but the integer.`;
	const raw = (await generateText(prompt)).trim();
	try
	{
		const val = parseInt(raw.split(/\s+/)[0], 10);
		return Math.max(-2, Math.min(2, val));
	}
	catch
	{
		return 0;
	}
};

export const reactToResponse = async (
	judge: JudgeConfig,
	question: string,
	userResponse: string,
	score: number
): Promise<string> =>
{
	const strength =
		score === 2 ? 'excellent' :
		score === 1 ? 'good' :
		score === 0 ? 'fair' :
		score === -1 ? 'weak' : 'poor';
	const prompt = `${judge.system_prompt}

You asked the following question during oral argument:
"${question}"

The attorney responded:
"${userResponse}"

You have evaluated this answer as "${strength}" (score: ${score} out of 2).

Provide a brief, one-sentence reaction to this answer from the bench.
If the answer was good or excellent, acknowledge its strength or move on with a brief "Thank you, counsel."
If the answer was fair, weak, or poor, explain briefly why you found it unsatisfying or what they failed to address.

Keep it very brief (one sentence) and in your specific judicial voice. Do not use any introductory phrases like "The judge says." Just the quote.`;
	return generateText(prompt);
};

export const deliberate = async (
	judge: JudgeConfig,
	caseName: string,
	brief: string,
	side: string,
	allMessages: HearingMessage[],
	dispositionScore: number
): Promise<JudgeVote> =>
{
	const history = formatHistory(allMessages);
	const party = side === 'plaintiff' ? 'petitioner' : 'respondent';
	const lean =
		dispositionScore > 0 ? 'slightly toward' :
		dispositionScore < 0 ? 'slightly against' : 'neutral toward';
	const prompt = `${judge.system_prompt}

You have just concluded oral arguments in ${caseName}.

The attorney argued as the ${party}.

Their brief:
${brief}

Full argument transcript:
${history}

Based on the arguments presented, your judicial philosophy, and your overall impression (you are leaning ${lean} the attorney's position), cast your vote and write your opinion.

Respond in this exact JSON format:
{
  "vote": "for" or "against",
  "opinion": "2-3 sentence opinion in your judicial voice explaining your reasoning"
}

"for" means you rule in favor of the attorney's position. "against" means you rule against them.
Return only valid JSON.`;

	let raw = (await generateText(prompt)).trim();

	try
	{
		if(raw.startsWith('```'))
		{
			const parts = raw.split('```');
			raw = parts[1] ?? '';
			if(raw.startsWith('json')) raw = raw.slice(4);
		}
		const data = JSON.parse(raw.trim());
		let vote: string = data.vote ?? 'against';
		if(vote !== 'for' && vote !== 'against')
			vote = dispositionScore > 0 ? 'for' : 'against';
		const opinion: string = data.opinion ?? 'The Court has considered the arguments presented.';
		return { judge_id: judge.id, judge_name: judge.name, vote, opinion_type: '', opinion };
	}
	catch
	{
		const vote = dispositionScore > 0 ? 'for' : 'against';
		return {
			judge_id: judge.id,
			judge_name: judge.name,
			vote,
			opinion_type: '',
			opinion: 'The Court has considered the arguments presented and reached its conclusion.',
		};
	}
};

export const deliberateCombined = async (
	judge: JudgeConfig,
	caseName: string,
	plaintiffBrief: string,
	plaintiffMessages: HearingMessage[],
	defendantBrief: string,
	defendantMessages: HearingMessage[]
): Promise<JudgeVote> =>
{
	const filterOral = (msgs: HearingMessage[]) =>
		msgs.filter(m => m.type === 'question' || m.speaker_id === 'user');

	const plaintiffOral = formatHistory(filterOral(plaintiffMessages));
	const defendantOral = formatHistory(filterOral(defendantMessages));

	const prompt = `${judge.system_prompt}

You have heard oral arguments from both sides in ${caseName}.

PLAINTIFF'S BRIEF:
${plaintiffBrief}

PLAINTIFF'S ORAL ARGUMENT:
${plaintiffOral}

DEFENDANT'S BRIEF:
${defendantBrief}

DEFENDANT'S ORAL ARGUMENT:
${defendantOral}

Having heard both sides, vote for whichever was more legally persuasive given your judicial philosophy.

Respond in this exact JSON format:
{
  "vote": "plaintiff" or "defendant",
  "opinion": "2-3 sentence opinion in your judicial voice explaining your reasoning"
}

Return only valid JSON.`;

	let raw = (await generateText(prompt)).trim();

	try
	{
		if(raw.startsWith('```'))
		{
			const parts = raw.split('```');
			raw = parts[1] ?? '';
			if(raw.startsWith('json')) raw = raw.slice(4);
		}
		const data = JSON.parse(raw.trim());
		let vote: string = data.vote ?? 'defendant';
		if(vote !== 'plaintiff' && vote !== 'defendant') vote = 'defendant';
		const opinion: string = data.opinion ?? 'The Court has considered the arguments presented.';
		return { judge_id: judge.id, judge_name: judge.name, vote, opinion_type: '', opinion };
	}
	catch
	{
		return {
			judge_id: judge.id,
			judge_name: judge.name,
			vote: 'defendant',
			opinion_type: '',
			opinion: 'The Court has considered the arguments presented and reached its conclusion.',
		};
	}
};

export const generateBenchAside = async (
	judge1: JudgeConfig,
	judge2: JudgeConfig,
	caseName: string,
	lastQuestion: string,
	userResponse: string
): Promise<[string, string]> =>
{
	const prompt = `You are two Supreme Court justices — ${judge1.name} (${judge1.philosophy}) and ${judge2.name} (${judge2.philosophy}) — who just heard counsel's response to: "${lastQuestion}". Counsel said: "${userResponse}". React to each other in exactly 2 very short sentences (one per justice), as an overheard bench conversation. Speak directly to each other, not to counsel. Be specific to what was just said. Format your response as:
${judge1.name}: <sentence>
${judge2.name}: <sentence>
Return ONLY those two lines, nothing else.`;

	const raw = (await generateText(prompt)).trim();
	const lines = raw.split('\n').map(l => l.trim()).filter(l => l.length > 0);

	const extract = (line: string) =>
	{
		const colonIdx = line.indexOf(':');
		if(colonIdx === -1) return line;
		return line.slice(colonIdx + 1).trim();
	};

	const line1 = extract(lines[0] ?? '');
	const line2 = extract(lines[1] ?? '');
	return [line1, line2];
};

export const pressFollowUp = async (
	judge: JudgeConfig,
	originalQuestion: string,
	userResponse: string
): Promise<string> =>
{
	const prompt = `${judge.system_prompt}. You asked: "${originalQuestion}". Counsel responded: "${userResponse}". You found this answer unsatisfying — it dodged, contradicted, or failed to address your core concern. In ONE pointed sentence, press counsel on the specific gap in their answer. Speak directly from the bench. Do not repeat your original question — zero in on what they failed to address.`;
	return generateText(prompt);
};
