import { askQuestion, scoreResponse, reactToResponse, deliberate, deliberateCombined, generateBenchAside, pressFollowUp } from '@/lib/agents/judge';
import { getHistoricalJudgeConfig } from '@/lib/services/historicalJudges';
import { argue, respondToQuestion } from '@/lib/agents/opposingCounsel';
import { HearingState, HearingMessage, HearingRuling, CombinedRuling, JudgeConfig, JudgeVote } from '@/types/hearing';
import { JUDGES, getJudgeById } from '@/lib/judges';
import { evaluate } from '@/lib/agents/scorer';

const PREFERRED_QUESTIONER_IDS = ['john_roberts', 'sonia_sotomayor', 'elena_kagan', 'ketanji_jackson', 'brett_kavanaugh', 'neil_gorsuch', 'william_brennan', 'thurgood_marshall', 'william_rehnquist'];
const TOTAL_TURNS = 4;

const resolveJudge = (id: string): JudgeConfig =>
{
	const historical = getHistoricalJudgeConfig(id);
	if(historical) return historical;
	return getJudgeById(id);
};

const makeMessage = (speaker: string, speakerId: string, content: string, type: string): HearingMessage =>
{
	return { id: crypto.randomUUID(), speaker, speaker_id: speakerId, content, type };
};

const shuffle = <T>(arr: T[]): T[] =>
{
	const copy = [...arr];
	for(let i = copy.length - 1; i > 0; i--)
	{
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
};

const getJudgesFromIds = (ids: string[], allJudges: JudgeConfig[]): JudgeConfig[] =>
	ids.map(id => allJudges.find(j => j.id === id)).filter(Boolean) as JudgeConfig[];

export const start = async (
	caseId: string,
	caseName: string,
	caseSummary: string,
	brief: string,
	side: string,
	judges?: JudgeConfig[]
): Promise<[HearingState, HearingMessage[]]> =>
{
	const bench = judges ?? JUDGES;
	const preferred = shuffle(bench.filter(j => PREFERRED_QUESTIONER_IDS.includes(j.id)));
	const remaining = shuffle(bench.filter(j => !PREFERRED_QUESTIONER_IDS.includes(j.id)));
	const questioningOrder = [...preferred, ...remaining].slice(0, TOTAL_TURNS).map(j => j.id);

	const judgeMap = Object.fromEntries(bench.map(j => [j.id, j]));
	const firstJudge = judgeMap[questioningOrder[0]];
	const firstQuestion = await askQuestion(firstJudge, caseName, caseSummary, brief, side, []);
	const openingMsg = makeMessage(firstJudge.name, firstJudge.id, firstQuestion, 'question');

	const dispositionScores: Record<string, number> = {};
	for(const j of bench) dispositionScores[j.id] = 0;

	const state: HearingState = {
		hearing_id: crypto.randomUUID(),
		case_id: caseId,
		case_name: caseName,
		case_summary: caseSummary,
		brief,
		side,
		phase: 'interrogation_user',
		turn: 1,
		total_turns: TOTAL_TURNS,
		messages: [openingMsg],
		disposition_scores: dispositionScores,
		questioning_order: questioningOrder,
		judge_ids: bench.map(j => j.id),
	};

	return [state, [openingMsg]];
};

export const processTurn = async (
	state: HearingState,
	userResponse: string
): Promise<[HearingState, HearingMessage[], HearingRuling | null]> =>
{
	const newMessages: HearingMessage[] = [];
	const bench = state.judge_ids?.length ? state.judge_ids.map(resolveJudge) : JUDGES;

	if(state.phase === 'interrogation_user')
	{
		const userMsg = makeMessage('You', 'user', userResponse, 'statement');
		state.messages.push(userMsg);
		newMessages.push(userMsg);

		const currentJudge = resolveJudge(state.questioning_order[state.turn - 1]);
		const lastQuestion = [...state.messages]
			.reverse()
			.find(m => m.speaker_id === currentJudge.id && m.type === 'question')?.content ?? '';

		const score = await scoreResponse(currentJudge, lastQuestion, userResponse, state.brief);
		state.disposition_scores[currentJudge.id] = Math.max(
			-5,
			Math.min(5, state.disposition_scores[currentJudge.id] + score)
		);

		const isLastTurn = state.turn >= state.total_turns;

		if(score <= 0 && Math.random() < 0.4 && !state.press_triggered && !isLastTurn)
		{
			const pressText = await pressFollowUp(currentJudge, lastQuestion, userResponse);
			const pressMsg = makeMessage(currentJudge.name, currentJudge.id, pressText, 'press');
			state.messages.push(pressMsg);
			newMessages.push(pressMsg);
			state.press_triggered = true;
			return [state, newMessages, null];
		}

		state.press_triggered = false;

		if(!isLastTurn)
		{
			const nextJudge = resolveJudge(state.questioning_order[state.turn]);
			const historySnapshot = [...state.messages];

			const [reaction, question] = await Promise.all([
				reactToResponse(currentJudge, lastQuestion, userResponse, score),
				askQuestion(nextJudge, state.case_name, state.case_summary, state.brief, state.side, historySnapshot),
			]);

			state.turn += 1;

			const reactionMsg = makeMessage(currentJudge.name, currentJudge.id, reaction, 'statement');
			state.messages.push(reactionMsg);
			newMessages.push(reactionMsg);

			const asideCandidates = shuffle(
				bench.filter(j => j.id !== currentJudge.id && j.id !== nextJudge.id)
			);

			if(asideCandidates.length >= 2)
			{
				const aside1 = asideCandidates[0];
				const aside2 = asideCandidates[1];
				const [line1, line2] = await generateBenchAside(aside1, aside2, state.case_name, lastQuestion, userResponse);

				const asideMsg1 = makeMessage(aside1.name, aside1.id, line1, 'aside');
				const asideMsg2 = makeMessage(aside2.name, aside2.id, line2, 'aside');
				state.messages.push(asideMsg1, asideMsg2);
				newMessages.push(asideMsg1, asideMsg2);
			}

			const qMsg = makeMessage(nextJudge.name, nextJudge.id, question, 'question');
			state.messages.push(qMsg);
			newMessages.push(qMsg);
		}
		else
		{
			const reaction = await reactToResponse(currentJudge, lastQuestion, userResponse, score);
			const reactionMsg = makeMessage(currentJudge.name, currentJudge.id, reaction, 'statement');
			state.messages.push(reactionMsg);
			newMessages.push(reactionMsg);

			const opposingSide = state.side === 'plaintiff' ? 'defendant' : 'plaintiff';
			const opposingArg = await argue(state.case_name, state.case_summary, state.brief, state.side, state.messages);
			const ocMsg = makeMessage('Opposing Counsel', 'opposing_counsel', opposingArg, 'argument');
			state.messages.push(ocMsg);
			newMessages.push(ocMsg);

			for(const idx of [0, 2])
			{
				const qJudge = resolveJudge(state.questioning_order[idx]);
				const aiQuestion = await askQuestion(
					qJudge,
					state.case_name,
					state.case_summary,
					state.brief,
					opposingSide,
					state.messages
				);
				const aiQMsg = makeMessage(qJudge.name, qJudge.id, aiQuestion, 'question');
				state.messages.push(aiQMsg);
				newMessages.push(aiQMsg);

				const ocResponse = await respondToQuestion(aiQuestion, state.case_name, state.case_summary, state.side);
				const ocRMsg = makeMessage('Opposing Counsel', 'opposing_counsel', ocResponse, 'statement');
				state.messages.push(ocRMsg);
				newMessages.push(ocRMsg);
			}

			const rebuttalPrompt = makeMessage('The Court', 'court', 'Counsel, you have one minute for rebuttal.', 'statement');
			state.messages.push(rebuttalPrompt);
			newMessages.push(rebuttalPrompt);
			state.phase = 'rebuttal';
		}

		return [state, newMessages, null];
	}

	if(state.phase === 'rebuttal')
	{
		const rebuttalMsg = makeMessage('You', 'user', userResponse, 'rebuttal');
		state.messages.push(rebuttalMsg);
		newMessages.push(rebuttalMsg);

		const [scores, ...votes] = await Promise.all([
			evaluate(state.brief, state.messages, state.side),
			...bench.map(j => deliberate(j, state.case_name, state.brief, state.side, state.messages, state.disposition_scores[j.id])),
		]) as [import('@/types/hearing').HearingScores, ...JudgeVote[]];

		const forVotes = votes.filter(v => v.vote === 'for');
		const againstVotes = votes.filter(v => v.vote === 'against');
		const result = forVotes.length >= 5 ? 'affirmed' : 'reversed';

		const majoritySide = result === 'affirmed' ? forVotes : againstVotes;
		const minoritySide = result === 'affirmed' ? againstVotes : forVotes;

		const scoreMultiplier = result === 'affirmed' ? 1 : -1;
		const majorityAuthor = majoritySide.reduce((best, v) =>
			(state.disposition_scores[v.judge_id] ?? 0) * scoreMultiplier >
			(state.disposition_scores[best.judge_id] ?? 0) * scoreMultiplier
				? v
				: best
		);
		majorityAuthor.opinion_type = 'majority';

		for(const v of majoritySide)
		{
			if(v.judge_id !== majorityAuthor.judge_id) v.opinion_type = 'concurrence';
		}
		for(const v of minoritySide)
		{
			v.opinion_type = 'dissent';
		}

		const swingJustices = votes
			.filter(v => Math.abs(state.disposition_scores[v.judge_id] ?? 0) <= 1)
			.map(v => v.judge_name);

		const ruling: HearingRuling = {
			result,
			vote_for: forVotes.length,
			vote_against: againstVotes.length,
			majority_opinion: majorityAuthor,
			concurrences: majoritySide.filter(v => v.judge_id !== majorityAuthor.judge_id),
			dissents: minoritySide,
			scores,
			swing_justices: swingJustices,
		};

		state.phase = 'concluded';
		return [state, newMessages, ruling];
	}

	return [state, [], null];
};

export const runCombinedDeliberation = async (
	plaintiffState: HearingState,
	defendantState: HearingState,
	judges: JudgeConfig[] = JUDGES
): Promise<CombinedRuling> =>
{
	const bench = plaintiffState.judge_ids?.length
		? plaintiffState.judge_ids.map(resolveJudge)
		: judges;

	const votes = await Promise.all(
		bench.map(j => deliberateCombined(
			j,
			plaintiffState.case_name,
			plaintiffState.brief,
			plaintiffState.messages,
			defendantState.brief,
			defendantState.messages
		))
	);

	const plaintiffVotes = votes.filter(v => v.vote === 'plaintiff');
	const defendantVotes = votes.filter(v => v.vote === 'defendant');
	const winner: 'plaintiff' | 'defendant' = plaintiffVotes.length >= 5 ? 'plaintiff' : 'defendant';

	const majorityVotes = winner === 'plaintiff' ? plaintiffVotes : defendantVotes;
	const minorityVotes = winner === 'plaintiff' ? defendantVotes : plaintiffVotes;

	const [majorityAuthor, ...majorityRest] = majorityVotes;
	majorityAuthor.opinion_type = 'majority';
	for(const v of majorityRest) v.opinion_type = 'concurrence';
	for(const v of minorityVotes) v.opinion_type = 'dissent';

	return {
		winner,
		vote_plaintiff: plaintiffVotes.length,
		vote_defendant: defendantVotes.length,
		majority_opinion: majorityAuthor,
		concurrences: majorityRest,
		dissents: minorityVotes,
	};
};
