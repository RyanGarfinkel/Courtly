from app.models.hearing import HearingMessage
from app.clients.gemini import GeminiClient

_gemini = GeminiClient()


def _format_transcript(messages: list[HearingMessage]) -> str:
	return '\n'.join(f'{m.speaker}: {m.content}' for m in messages)


def summarize(messages: list[HearingMessage], case_name: str, brief: str) -> str:
	transcript = _format_transcript(messages)

	prompt = f'''You are a law clerk helping a non-lawyer understand what is happening during oral arguments in {case_name}.

The attorney's brief:
{brief}

Argument transcript so far:
{transcript}

Summarize what has happened so far in plain, accessible English — no legal jargon. Cover:
- What the attorney is arguing and why
- What the justices are probing or challenging
- How the argument seems to be going

Keep it conversational and under 150 words. Write as if explaining to a dumb friend who hasn't been to law school.'''

	return _gemini.generate(prompt)


def answer_question(question: str, messages: list[HearingMessage], case_name: str, brief: str) -> str:
	transcript = _format_transcript(messages)

	prompt = f'''You are a knowledgeable law clerk helping someone follow along during oral arguments in {case_name}.

The attorney's brief:
{brief}

Argument transcript so far:
{transcript}

The observer is asking: "{question}"

Answer helpfully and clearly. If the question is about a legal term or concept, explain it plainly with a brief example from the current case if relevant. If the question is about the argument's progress, give an honest, grounded assessment based on what the justices have asked. Keep your answer concise — 2-4 sentences.'''

	return _gemini.generate(prompt)
