from app.models.hearing import HearingMessage
from app.clients.gemini import GeminiClient

_gemini = GeminiClient()


def _format_user_exchanges(messages: list[HearingMessage]) -> str:
	lines = []
	for m in messages:
		if m.speaker_id in ('user', 'opposing_counsel'):
			lines.append(f'{m.speaker}: {m.content}')
	return '\n'.join(lines) if lines else 'No prior exchanges.'


def argue(
	case_name: str,
	case_summary: str,
	brief: str,
	side: str,
	user_messages: list[HearingMessage],
) -> str:
	opposing_side = 'respondent' if side == 'plaintiff' else 'petitioner'
	exchanges = _format_user_exchanges(user_messages)

	prompt = f'''You are a skilled appellate attorney arguing as the {opposing_side} in {case_name}.

Case background: {case_summary}

Your opponent has argued:
{brief}

During questioning, the opponent said:
{exchanges}

Deliver your oral argument. In 3-4 sentences, make the strongest counter-argument to their position. Reference specific weaknesses that emerged during their questioning. Be direct, confident, and legally precise. Do not introduce yourself — begin arguing immediately.'''

	return _gemini.generate(prompt)


def respond_to_question(
	question: str,
	case_name: str,
	case_summary: str,
	side: str,
) -> str:
	opposing_side = 'respondent' if side == 'plaintiff' else 'petitioner'

	prompt = f'''You are a skilled appellate attorney arguing as the {opposing_side} in {case_name}.

Case background: {case_summary}

A Justice has asked you:
"{question}"

Respond directly and persuasively in 2-3 sentences. Stay in character as appellate counsel.'''

	return _gemini.generate(prompt)
