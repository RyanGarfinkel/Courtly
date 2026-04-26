import { generateText } from '@/lib/gemini';

export async function draft(
	caseName: string,
	caseSummary: string,
	category: string,
	year: number,
	citation: string,
	side: string = 'plaintiff',
	userNotes: string = ''
): Promise<string>
{
	const notesSection = userNotes.trim()
		? `\n\nAttorney's notes / position:\n${userNotes}`
		: '';
	const role = side === 'plaintiff' ? 'petitioner (plaintiff)' : 'respondent (defendant)';
	const prompt = `You are a skilled appellate attorney preparing oral argument hints for the Supreme Court.

Case: ${caseName} (${citation}, ${year})
Category: ${category}
Background: ${caseSummary}${notesSection}

The attorney is arguing as the ${role}. Provide hints about the strongest legal arguments available to the ${role}, structured as:
1. Core legal theory and how it applies to this case
2. Key precedents or constitutional principles that support the ${role}'s position
3. How to frame the argument persuasively to the Court

Write in short, concise bullet point form (between 5-10 bullet points, each one sentence). Do not include any header and get straight to the bullet points. Be specific to the ${role}'s position.`;
	return generateText(prompt);
}

export async function expandNotes(
	content: string,
	caseName: string,
	caseSummary: string
): Promise<string>
{
	const prompt = `You are a skilled appellate attorney turning notes into a formal legal brief.
Case: ${caseName}
Background: ${caseSummary}
The attorney has written the following notes or bullet points:
${content}
Expand these into a compelling, formal legal argument. Maintain the attorney's core positions but develop each point with legal reasoning, constitutional analysis, and persuasive language. Write 3-5 paragraphs in formal appellate prose. Do not introduce arguments not suggested by the notes.`;
	return generateText(prompt);
}

export async function strengthen(content: string, caseName: string): Promise<string>
{
	const prompt = `You are a senior appellate attorney reviewing a legal brief before oral argument.
Case: ${caseName}
Review the following argument and return a strengthened version:
${content}
Improve it by:
- Sharpening the legal reasoning and logical structure
- Adding specific constitutional provisions or precedents where appropriate
- Making the language more precise and persuasive
- Removing weak or redundant passages
Return only the improved argument text, same approximate length.`;
	return generateText(prompt);
}

export async function counterarguments(content: string, caseName: string): Promise<string>
{
	const prompt = `You are a law clerk preparing an attorney for oral argument before the Supreme Court.
Case: ${caseName}
The attorney's argument is:
${content}
Identify the 3-4 strongest counterarguments the opposing side or skeptical justices might raise. For each, briefly explain the argument and how the attorney might respond.
Format as a numbered list. Be specific and realistic.`;
	return generateText(prompt);
}
