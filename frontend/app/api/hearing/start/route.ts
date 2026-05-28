import { getBenchForYear, getHistoricalJudgeConfig, getHistoricalUIJudge } from '@/lib/services/historicalJudges';
import { getMatch, updateMatch } from '@/lib/services/multiplayerStore';
import { start as orchestrateStart } from '@/lib/orchestrators/hearing';
import { createHearing } from '@/lib/services/hearingStore';
import { NextRequest, NextResponse } from 'next/server';
import { JUDGES } from '@/lib/judges';
import { auth0 } from '@/lib/auth0';

export const maxDuration = 60;

export const POST = async (req: NextRequest) =>
{
	try
	{
		const { case_id, case_name, case_summary, brief, side, match_id, case_year } = await req.json();

		let judges = JUDGES;

		if(case_year && typeof case_year === 'number')
		{
			const historicalBench = getBenchForYear(case_year);

			if(historicalBench.length === 9)
			{
				const configs = historicalBench
					.map(j => getHistoricalJudgeConfig(j.id))
					.filter(Boolean) as typeof JUDGES;

				if(configs.length === 9) judges = configs;
			}
		}

		const [state, messages] = await orchestrateStart(case_id, case_name, case_summary, brief, side, judges);

		if(match_id)
		{
			const session = await auth0.getSession();
			if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

			const match = await getMatch(match_id);
			if(!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

			state.match_id = match_id;

			const userId = session.user.sub;

			if(match.plaintiff?.user_id === userId)
			{
				match.plaintiff.hearing_id = state.hearing_id;
				match.plaintiff.status = 'in_progress';
			}
			else if(match.defendant?.user_id === userId)
			{
				match.defendant.hearing_id = state.hearing_id;
				match.defendant.status = 'in_progress';
			}

			await updateMatch(match);
		}

		await createHearing(state);

		return NextResponse.json({
			hearing_id: state.hearing_id,
			messages,
			phase: state.phase,
			turn: state.turn,
			total_turns: state.total_turns,
			judges: judges.map(j => getHistoricalUIJudge(j.id)),
		});
	}
	catch(err)
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
};
