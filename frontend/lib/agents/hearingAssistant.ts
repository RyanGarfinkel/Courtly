import { HearingMessage } from '@/types/hearing';
import { generateText } from '@/lib/gemini';

function formatTranscript(messages: HearingMessage[]): string
{
	return messages.map(m => `${m.speaker}: ${m.content}`).join('\n');
}

export async function summarize(
	messages: HearingMessage[],
	caseName: string,
	brief: string
): Promise<string>
{
	const transcript = formatTranscript(messages);
	const prompt = `You are a law clerk helping a non-lawyer understand what is happening during oral arguments in ${caseName}.
The attorney's brief:
${brief}
Argument transcript so far:
${transcript}
Summarize what has happened so far in plain, accessible English — no legal jargon. Cover:
- What the attorney is arguing and why
- What the justices are probing or challenging
- How the argument seems to be going
Keep it conversational and under 150 words. Write as if explaining to a dumb friend who hasn't been to law school.`;
	return generateText(prompt);
}

export async function answerQuestion(
	question: string,
	messages: HearingMessage[],
	caseName: string,
	brief: string
): Promise<string>
{
	const transcript = formatTranscript(messages);
	const prompt = `You are a knowledgeable law clerk helping someone follow along during oral arguments in ${caseName}.
The attorney's brief:
${brief}
Argument transcript so far:
${transcript}
The observer is asking: "${question}"
Answer helpfully and clearly. If the question is about a legal term or concept, explain it plainly with a brief example from the current case if relevant. If the question is about the argument's progress, give an honest, grounded assessment based on what the justices have asked. Keep your answer concise — 2-4 sentences.`;
	return generateText(prompt);
}

export async function generateHints(
	question: string,
	messages: HearingMessage[],
	caseName: string,
	brief: string
): Promise<string[]>
{
	const transcript = formatTranscript(messages);
	const prompt = `You are a senior law clerk helping an attorney prepare a response to a justice's question during oral arguments in ${caseName}.
The attorney's brief position:
${brief}
Transcript so far:
${transcript}
The justice's last question: "${question}"
Provide 3-5 brief bullet points (ideas) for how the attorney could effectively respond to this question.
- Each point must be a single sentence or less.
- Each point should offer a distinct angle or piece of reasoning.
- Stay consistent with the attorney's brief and the case context.
Format your response as a simple list of strings, one per line, no numbering or extra characters. Just the text of the points.`;
	const raw = (await generateText(prompt)).trim();
	const hints = raw
		.split('\n')
		.map(line => line.trim().replace(/^[-*]\s*/, ''))
		.filter(line => line.length > 0);
	return hints.slice(0, 5);
}
