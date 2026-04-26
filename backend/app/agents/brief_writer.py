from app.clients.gemini import GeminiClient

_gemini = GeminiClient()

def draft(case_name: str, case_summary: str, category: str, year: int, citation: str, side: str = "plaintiff", user_notes: str = "") -> str:
	notes_section = f"\n\nAttorney's notes / position:\n{user_notes}" if user_notes.strip() else ""
	role = "petitioner (plaintiff)" if side == "plaintiff" else "respondent (defendant)"

	prompt = f"""You are a skilled appellate attorney preparing oral argument hints for the Supreme Court.

Case: {case_name} ({citation}, {year})
Category: {category}
Background: {case_summary}{notes_section}

The attorney is arguing as the {role}. Provide hints about the strongest legal arguments available to the {role}, structured as:
1. Core legal theory and how it applies to this case
2. Key precedents or constitutional principles that support the {role}'s position
3. How to frame the argument persuasively to the Court

Write in short, concise bullet point form (between 5-10 bullet points, each one sentence). Do not include any header and get straight to the bullet points. Be specific to the {role}'s position."""

	return _gemini.generate(prompt)


def expand_notes(content: str, case_name: str, case_summary: str) -> str:
	prompt = f"""You are a skilled appellate attorney turning notes into a formal legal brief.

Case: {case_name}
Background: {case_summary}

The attorney has written the following notes or bullet points:
{content}

Expand these into a compelling, formal legal argument. Maintain the attorney's core positions but develop each point with legal reasoning, constitutional analysis, and persuasive language. Write 3-5 paragraphs in formal appellate prose. Do not introduce arguments not suggested by the notes."""

	return _gemini.generate(prompt)


def strengthen(content: str, case_name: str) -> str:
	prompt = f"""You are a senior appellate attorney reviewing a legal brief before oral argument.

Case: {case_name}

Review the following argument and return a strengthened version:
{content}

Improve it by:
- Sharpening the legal reasoning and logical structure
- Adding specific constitutional provisions or precedents where appropriate
- Making the language more precise and persuasive
- Removing weak or redundant passages

Return only the improved argument text, same approximate length."""

	return _gemini.generate(prompt)


def counterarguments(content: str, case_name: str) -> str:
	prompt = f"""You are a law clerk preparing an attorney for oral argument before the Supreme Court.

Case: {case_name}

The attorney's argument is:
{content}

Identify the 3-4 strongest counterarguments the opposing side or skeptical justices might raise. For each, briefly explain the argument and how the attorney might respond.

Format as a numbered list. Be specific and realistic."""

	return _gemini.generate(prompt)
