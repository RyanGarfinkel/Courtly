from app.clients.gemini import GeminiClient
import json

_gemini = GeminiClient()

_FALLBACK = {
	'claims': [{'id': 'c1', 'text': 'Your argument', 'strength': 50}],
	'counters': [{'id': 'k1', 'text': 'Unable to generate counter-arguments', 'attacks': ['c1'], 'severity': 'medium'}]
}


def map_arguments(draft: str, question: str, brief: str, case_name: str) -> dict:
	prompt = f'''You are a Supreme Court advocacy analyst decomposing an attorney's oral argument.

Case: {case_name}

Submitted brief:
{brief}

Justice's question:
{question}

Attorney's draft response:
{draft}

Decompose the attorney's draft into 2-4 discrete claim nodes. For each claim, generate 1-2 counter-arguments that directly attack it — the kind a hostile justice or opposing counsel would raise.

Rules:
- Claims must be short, self-contained statements extracted from the draft (max 15 words each)
- Counters must be sharp, realistic opposing arguments (max 15 words each)
- Each counter must list which claim IDs it attacks (a counter can attack multiple claims)
- 2-4 claims total, 2-5 counters total
- strength: 0-100 rating of how strong the claim is
- severity: "high" = strongly undermines the claim, "medium" = meaningful challenge, "low" = minor quibble

Return ONLY valid JSON in this exact shape:
{{
  "claims": [
    {{ "id": "c1", "text": "Brief statement of the claim (max 15 words)", "strength": 75 }}
  ],
  "counters": [
    {{ "id": "k1", "text": "Brief statement of the counter-argument (max 15 words)", "attacks": ["c1"], "severity": "high" }}
  ]
}}'''

	raw = _gemini.generate(prompt).strip()

	try:
		if raw.startswith('```'):
			raw = raw.split('```')[1]
			if raw.startswith('json'):
				raw = raw[4:]
		data = json.loads(raw.strip())
		if not isinstance(data.get('claims'), list):
			data['claims'] = _FALLBACK['claims']
		if not isinstance(data.get('counters'), list):
			data['counters'] = _FALLBACK['counters']
		return data
	except (json.JSONDecodeError, KeyError, TypeError, ValueError):
		return _FALLBACK
