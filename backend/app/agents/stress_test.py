from app.clients.gemini import GeminiClient
import json

_gemini = GeminiClient()

_FALLBACK = {
	'scores': {'relevance': 50, 'legal_strength': 50, 'consistency': 50, 'clarity': 50},
	'weaknesses': ['Unable to analyze response.'],
	'suggestions': ['Try rephrasing your argument more directly.']
}


def analyze(question: str, draft: str, brief: str, case_name: str) -> dict:
	prompt = f'''You are a Supreme Court advocacy coach evaluating a draft oral argument response.

Case: {case_name}

Submitted brief:
{brief}

Justice's question:
{question}

Attorney's draft response:
{draft}

Evaluate the draft on four dimensions, each scored 0–100:

- relevance: Does the response directly answer what the justice asked? (0 = total evasion, 100 = perfectly on point)
- legal_strength: Is the legal reasoning sound, grounded in law or precedent? (0 = no legal foundation, 100 = airtight reasoning)
- consistency: Does it stay consistent with the positions taken in the original brief? (0 = directly contradicts the brief, 100 = fully aligned)
- clarity: Is the response clear, organized, and persuasive? (0 = confused and rambling, 100 = crisp and compelling)

Also identify 2–4 specific weaknesses in the draft and 2–4 concrete suggestions to strengthen it before submitting.

Return ONLY valid JSON in this exact shape:
{{
  "scores": {{
    "relevance": <0-100>,
    "legal_strength": <0-100>,
    "consistency": <0-100>,
    "clarity": <0-100>
  }},
  "weaknesses": ["...", "..."],
  "suggestions": ["...", "..."]
}}'''

	raw = _gemini.generate(prompt).strip()

	try:
		if raw.startswith('```'):
			raw = raw.split('```')[1]
			if raw.startswith('json'):
				raw = raw[4:]
		data = json.loads(raw.strip())
		if not isinstance(data.get('scores'), dict):
			return _FALLBACK
		required = {'relevance', 'legal_strength', 'consistency', 'clarity'}
		if not required.issubset(data['scores'].keys()):
			return _FALLBACK
		if not isinstance(data.get('weaknesses'), list):
			data['weaknesses'] = []
		if not isinstance(data.get('suggestions'), list):
			data['suggestions'] = []
		return data
	except (json.JSONDecodeError, KeyError, TypeError, ValueError):
		return _FALLBACK
