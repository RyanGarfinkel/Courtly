import { generateText } from '@/lib/gemini';

interface StressTestScores
{
	relevance: number;
	legal_strength: number;
	consistency: number;
	clarity: number;
}

interface StressTestResult
{
	scores: StressTestScores;
	weaknesses: string[];
	suggestions: string[];
}

const FALLBACK: StressTestResult = {
	scores: { relevance: 50, legal_strength: 50, consistency: 50, clarity: 50 },
	weaknesses: ['Unable to analyze response.'],
	suggestions: ['Try rephrasing your argument more directly.'],
};

export async function analyze(
	question: string,
	draft: string,
	brief: string,
	caseName: string
): Promise<StressTestResult>
{
	const prompt = `You are a Supreme Court advocacy coach evaluating a draft oral argument response.
Case: ${caseName}
Submitted brief:
${brief}
Justice's question:
${question}
Attorney's draft response:
${draft}
Evaluate the draft on four dimensions, each scored 0–100:
- relevance: Does the response directly answer what the justice asked? (0 = total evasion, 100 = perfectly on point)
- legal_strength: Is the legal reasoning sound, grounded in law or precedent? (0 = no legal foundation, 100 = airtight reasoning)
- consistency: Does it stay consistent with the positions taken in the original brief? (0 = directly contradicts the brief, 100 = fully aligned)
- clarity: Is the response clear, organized, and persuasive? (0 = confused and rambling, 100 = crisp and compelling)
Also identify 2–4 specific weaknesses in the draft and 2–4 concrete suggestions to strengthen it before submitting.
Return ONLY valid JSON in this exact shape:
{
  "scores": {"relevance": <0-100>, "legal_strength": <0-100>, "consistency": <0-100>, "clarity": <0-100>},
  "weaknesses": ["...", "..."],
  "suggestions": ["...", "..."]
}`;

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
		if(!data.scores || !data.weaknesses || !data.suggestions) return FALLBACK;
		return {
			scores: {
				relevance: data.scores.relevance ?? 50,
				legal_strength: data.scores.legal_strength ?? 50,
				consistency: data.scores.consistency ?? 50,
				clarity: data.scores.clarity ?? 50,
			},
			weaknesses: data.weaknesses,
			suggestions: data.suggestions,
		};
	}
	catch
	{
		return FALLBACK;
	}
}
