from app.agents import judge as judge_agent, opposing_counsel as counsel_agent, scorer
from app.models.hearing import HearingState, HearingMessage, HearingRuling, JudgeConfig
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import random
import uuid
import json

PREFERRED_QUESTIONER_IDS = ['hale', 'voss', 'crane', 'lim']

_JUDGES_PATH = Path(__file__).parent.parent.parent / 'config' / 'judges.json'

_judges: list[JudgeConfig] = []


def _load_judges() -> list[JudgeConfig]:
	global _judges
	if not _judges:
		with open(_JUDGES_PATH) as f:
			_judges = [JudgeConfig(**j) for j in json.load(f)]
	return _judges


def _judge_by_id(judge_id: str) -> JudgeConfig:
	return next(j for j in _load_judges() if j.id == judge_id)


def _make_message(speaker: str, speaker_id: str, content: str, msg_type: str) -> HearingMessage:
	return HearingMessage(
		id=str(uuid.uuid4()),
		speaker=speaker,
		speaker_id=speaker_id,
		content=content,
		type=msg_type,
	)


def start(
	case_id: str,
	case_name: str,
	case_summary: str,
	brief: str,
	side: str,
) -> tuple[HearingState, list[HearingMessage]]:
	judges = _load_judges()

	preferred = [j for j in judges if j.id in PREFERRED_QUESTIONER_IDS]
	remaining = [j for j in judges if j.id not in PREFERRED_QUESTIONER_IDS]
	random.shuffle(preferred)
	random.shuffle(remaining)
	questioning_order = [j.id for j in (preferred + remaining)[:4]]

	first_judge = _judge_by_id(questioning_order[0])
	first_question = judge_agent.ask_question(
		first_judge, case_name, case_summary, brief, side, []
	)

	opening_msg = _make_message(first_judge.name, first_judge.id, first_question, 'question')

	state = HearingState(
		hearing_id=str(uuid.uuid4()),
		case_id=case_id,
		case_name=case_name,
		case_summary=case_summary,
		brief=brief,
		side=side,
		phase='interrogation_user',
		turn=1,
		total_turns=4,
		messages=[opening_msg],
		disposition_scores={j.id: 0 for j in judges},
		questioning_order=questioning_order,
	)

	return state, [opening_msg]


def process_turn(
	state: HearingState,
	user_response: str,
) -> tuple[HearingState, list[HearingMessage], HearingRuling | None]:
	new_messages: list[HearingMessage] = []

	if state.phase == 'interrogation_user':
		user_msg = _make_message('You', 'user', user_response, 'statement')
		state.messages.append(user_msg)
		new_messages.append(user_msg)

		current_judge = _judge_by_id(state.questioning_order[state.turn - 1])
		last_question = next(
			(m.content for m in reversed(state.messages) if m.speaker_id == current_judge.id and m.type == 'question'),
			''
		)
		score = judge_agent.score_response(current_judge, last_question, user_response, state.brief)
		state.disposition_scores[current_judge.id] = max(-5, min(5, state.disposition_scores[current_judge.id] + score))

		if state.turn < state.total_turns:
			next_judge = _judge_by_id(state.questioning_order[state.turn])
			history_snapshot = list(state.messages)
			with ThreadPoolExecutor(max_workers=2) as pool:
				react_future = pool.submit(judge_agent.react_to_response, current_judge, last_question, user_response, score)
				question_future = pool.submit(
					judge_agent.ask_question,
					next_judge, state.case_name, state.case_summary, state.brief, state.side, history_snapshot,
				)
				reaction = react_future.result()
				question = question_future.result()

			state.turn += 1
			reaction_msg = _make_message(current_judge.name, current_judge.id, reaction, 'statement')
			state.messages.append(reaction_msg)
			new_messages.append(reaction_msg)
			q_msg = _make_message(next_judge.name, next_judge.id, question, 'question')
			state.messages.append(q_msg)
			new_messages.append(q_msg)
		else:
			reaction = judge_agent.react_to_response(current_judge, last_question, user_response, score)
			reaction_msg = _make_message(current_judge.name, current_judge.id, reaction, 'statement')
			state.messages.append(reaction_msg)
			new_messages.append(reaction_msg)

			opposing_arg = counsel_agent.argue(
				state.case_name,
				state.case_summary,
				state.brief,
				state.side,
				state.messages,
			)
			oc_msg = _make_message('Opposing Counsel', 'opposing_counsel', opposing_arg, 'argument')
			state.messages.append(oc_msg)
			new_messages.append(oc_msg)

			for idx in [0, 2]:
				q_judge = _judge_by_id(state.questioning_order[idx])
				ai_question = judge_agent.ask_question(
					q_judge,
					state.case_name,
					state.case_summary,
					state.brief,
					'defendant' if state.side == 'plaintiff' else 'plaintiff',
					state.messages,
				)
				ai_q_msg = _make_message(q_judge.name, q_judge.id, ai_question, 'question')
				state.messages.append(ai_q_msg)
				new_messages.append(ai_q_msg)

				oc_response = counsel_agent.respond_to_question(
					ai_question,
					state.case_name,
					state.case_summary,
					state.side,
				)
				oc_r_msg = _make_message('Opposing Counsel', 'opposing_counsel', oc_response, 'statement')
				state.messages.append(oc_r_msg)
				new_messages.append(oc_r_msg)

			rebuttal_prompt = _make_message(
				'The Court',
				'court',
				'Counsel, you have one minute for rebuttal.',
				'statement',
			)
			state.messages.append(rebuttal_prompt)
			new_messages.append(rebuttal_prompt)
			state.phase = 'rebuttal'

		return state, new_messages, None

	if state.phase == 'rebuttal':
		rebuttal_msg = _make_message('You', 'user', user_response, 'rebuttal')
		state.messages.append(rebuttal_msg)
		new_messages.append(rebuttal_msg)

		scores = scorer.evaluate(state.brief, state.messages, state.side)

		all_judges = _load_judges()
		votes = [
			judge_agent.deliberate(
				j,
				state.case_name,
				state.brief,
				state.side,
				state.messages,
				state.disposition_scores[j.id],
			)
			for j in all_judges
		]

		for_votes = [v for v in votes if v.vote == 'for']
		against_votes = [v for v in votes if v.vote == 'against']
		result = 'affirmed' if len(for_votes) >= 5 else 'reversed'

		majority_side = for_votes if result == 'affirmed' else against_votes
		minority_side = against_votes if result == 'affirmed' else for_votes

		majority_author = max(
			majority_side,
			key=lambda v: state.disposition_scores.get(v.judge_id, 0) * (1 if result == 'affirmed' else -1),
		)
		majority_author.opinion_type = 'majority'

		concurrences = [v for v in majority_side if v.judge_id != majority_author.judge_id]
		for v in concurrences:
			v.opinion_type = 'concurrence'

		for v in minority_side:
			v.opinion_type = 'dissent'

		swing_justices = [
			v.judge_name for v in votes
			if abs(state.disposition_scores.get(v.judge_id, 0)) <= 1
		]

		ruling = HearingRuling(
			result=result,
			vote_for=len(for_votes),
			vote_against=len(against_votes),
			majority_opinion=majority_author,
			concurrences=concurrences,
			dissents=minority_side,
			scores=scores,
			swing_justices=swing_justices,
		)

		state.phase = 'concluded'
		return state, new_messages, ruling

	return state, [], None
