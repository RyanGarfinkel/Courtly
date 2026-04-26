from app.models.hearing import JudgeConfig, HearingMessage, JudgeVote
from app.clients.gemini import GeminiClient
import json

_gemini = GeminiClient()


def _format_history(messages: list[HearingMessage]) -> str:
    if not messages:
        return 'No exchanges yet.'
    lines = []
    for m in messages:
        lines.append(f'{m.speaker}: {m.content}')
    return '\n'.join(lines)


def ask_question(
    judge: JudgeConfig,
    case_name: str,
    case_summary: str,
    brief: str,
    side: str,
    conversation_history: list[HearingMessage],
) -> str:
    history = _format_history(conversation_history)
    prompt = f'''{judge.system_prompt}

You are presiding over oral arguments in {case_name}.

Case background: {case_summary}

The attorney is arguing as the {'petitioner (plaintiff)' if side == 'plaintiff' else 'respondent (defendant)'}.

Their submitted brief:
{brief}

Conversation so far:
{history}

Ask a single, pointed oral argument question that challenges the attorney based on your judicial philosophy. Be direct, skeptical, and specific to their argument. Do not preface the question — ask it immediately as you would from the bench. One question only.'''

    return _gemini.generate(prompt)


def score_response(
    judge: JudgeConfig,
    question: str,
    user_response: str,
    brief: str,
) -> int:
    prompt = f'''{judge.system_prompt}

You asked the following question during oral argument:
"{question}"

The attorney responded:
"{user_response}"

Their original brief position:
{brief}

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

Return nothing but the integer.'''

    raw = _gemini.generate(prompt).strip()
    try:
        val = int(raw.split()[0])
        return max(-2, min(2, val))
    except (ValueError, IndexError):
        return 0


def react_to_response(
    judge: JudgeConfig,
    question: str,
    user_response: str,
    score: int,
) -> str:
    strength = "excellent" if score == 2 else "good" if score == 1 else "fair" if score == 0 else "weak" if score == -1 else "poor"

    prompt = f'''{judge.system_prompt}

You asked the following question during oral argument:
"{question}"

The attorney responded:
"{user_response}"

You have evaluated this answer as "{strength}" (score: {score} out of 2).

Provide a brief, one-sentence reaction to this answer from the bench.
If the answer was good or excellent, acknowledge its strength or move on with a brief "Thank you, counsel."
If the answer was fair, weak, or poor, explain briefly why you found it unsatisfying or what they failed to address.

Keep it very brief (one sentence) and in your specific judicial voice. Do not use any introductory phrases like "The judge says." Just the quote.'''

    return _gemini.generate(prompt)


def deliberate(
    judge: JudgeConfig,
    case_name: str,
    brief: str,
    side: str,
    all_messages: list[HearingMessage],
    disposition_score: int,
) -> JudgeVote:
    history = _format_history(all_messages)
    lean = 'slightly toward' if disposition_score > 0 else 'slightly against' if disposition_score < 0 else 'neutral toward'

    prompt = f'''{judge.system_prompt}

You have just concluded oral arguments in {case_name}.

The attorney argued as the {'petitioner' if side == 'plaintiff' else 'respondent'}.

Their brief:
{brief}

Full argument transcript:
{history}

Based on the arguments presented, your judicial philosophy, and your overall impression (you are leaning {lean} the attorney's position), cast your vote and write your opinion.

Respond in this exact JSON format:
{{
  "vote": "for" or "against",
  "opinion": "2-3 sentence opinion in your judicial voice explaining your reasoning"
}}

"for" means you rule in favor of the attorney's position. "against" means you rule against them.
Return only valid JSON.'''

    raw = _gemini.generate(prompt).strip()

    try:
        if raw.startswith('```'):
            raw = raw.split('```')[1]
            if raw.startswith('json'):
                raw = raw[4:]
        data = json.loads(raw.strip())
        vote = data.get('vote', 'against')
        if vote not in ('for', 'against'):
            vote = 'for' if disposition_score > 0 else 'against'
        opinion = data.get('opinion', 'The Court has considered the arguments presented.')
    except (json.JSONDecodeError, KeyError):
        vote = 'for' if disposition_score > 0 else 'against'
        opinion = 'The Court has considered the arguments presented and reached its conclusion.'

    return JudgeVote(
        judge_id=judge.id,
        judge_name=judge.name,
        vote=vote,
        opinion_type='',
        opinion=opinion,
    )
