from app.models.hearing import HearingMessage, HearingScores
from app.clients.gemini import GeminiClient

_gemini = GeminiClient()

DEFAULT_SCORES = HearingScores(consistency=50.0, precedent=50.0, responsiveness=50.0, overall=50.0)


def _format_history(messages: list[HearingMessage]) -> str:
	return '\n'.join(f'{m.speaker}: {m.content}' for m in messages)


def evaluate(brief: str, all_messages: list[HearingMessage], side: str) -> HearingScores:
	history = _format_history(all_messages)

	prompt = f'''You are a Supreme Court law clerk evaluating an attorney's oral argument performance.

The attorney argued as the {'petitioner' if side == 'plaintiff' else 'respondent'}.

Their submitted brief:
{brief}

Full argument transcript:
{history}

Score the attorney's performance from 0 to 100 on each dimension:

- consistency: Did the attorney stay consistent with their brief, or did they contradict themselves? (0 = many contradictions, 100 = fully consistent)
- precedent: Did the attorney demonstrate knowledge of and respect for relevant case law and stare decisis? (0 = ignored precedent, 100 = excellent citation and application of precedent)
- responsiveness: Did the attorney actually answer the justices' questions, or did they pivot and dodge? (0 = complete evasion, 100 = directly and fully responsive)

Return ONLY valid JSON in this exact format:
{{"consistency": <number>, "precedent": <number>, "responsiveness": <number>}}'''

	import json
	raw = _gemini.generate(prompt).strip()

	try:
		if raw.startswith('```'):
			raw = raw.split('```')[1]
			if raw.startswith('json'):
				raw = raw[4:]
		data = json.loads(raw.strip())
		c = float(data.get('consistency', 50))
		p = float(data.get('precedent', 50))
		r = float(data.get('responsiveness', 50))
		overall = round(c * 0.3 + p * 0.3 + r * 0.4, 1)
		return HearingScores(consistency=c, precedent=p, responsiveness=r, overall=overall)
	except (json.JSONDecodeError, KeyError, TypeError, ValueError):
		return DEFAULT_SCORES
