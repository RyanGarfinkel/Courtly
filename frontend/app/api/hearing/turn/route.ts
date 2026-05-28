import { getMatch, updateMatch } from '@/lib/services/multiplayerStore';
import { processTurn, runCombinedDeliberation } from '@/lib/orchestrators/hearing';
import { getHearing, updateHearing } from '@/lib/services/hearingStore';
import { saveRecord } from '@/lib/services/recordStore';
import { HearingRecord } from '@/types/record';
import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export const maxDuration = 120;

export const POST = async (req: NextRequest) =>
{
	try
	{
		const { hearing_id, user_response } = await req.json();
		const state = await getHearing(hearing_id);
		if(!state) return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });

		const [newState, newMessages, ruling] = await processTurn(state, user_response);
		await updateHearing(newState);

		if(ruling)
		{
			try
			{
				const session = await auth0.getSession();
				if(session)
				{
					const record: HearingRecord = {
						record_id: crypto.randomUUID(),
						user_id: session.user.sub,
						hearing_id: hearing_id,
						case_id: newState.case_id,
						case_name: newState.case_name,
						case_year: newState.case_year,
						case_category: undefined,
						side: newState.side as 'plaintiff' | 'defendant',
						result: ruling.result as 'affirmed' | 'reversed',
						vote_for: ruling.vote_for,
						vote_against: ruling.vote_against,
						scores: ruling.scores,
						swing_justices: ruling.swing_justices,
						messages: newState.messages,
						argued_at: new Date().toISOString(),
					};
					await saveRecord(record);
				}
			}
			catch {}
		}

		if(ruling && newState.match_id)
		{
			const match = await getMatch(newState.match_id);
			if(match)
			{
				if(match.plaintiff && match.plaintiff.hearing_id === hearing_id)
				{
					match.plaintiff.ruling = ruling;
					match.plaintiff.status = 'concluded';
				}
				else if(match.defendant && match.defendant.hearing_id === hearing_id)
				{
					match.defendant.ruling = ruling;
					match.defendant.status = 'concluded';
				}

				const bothConcluded =
					match.plaintiff?.status === 'concluded' &&
					match.defendant?.status === 'concluded';

				if(bothConcluded)
				{
					try
					{
						const plaintiffHearingId = match.plaintiff!.hearing_id!;
						const defendantHearingId = match.defendant!.hearing_id!;
						const isPlaintiff = match.plaintiff?.hearing_id === hearing_id;
						const otherHearingId = isPlaintiff ? defendantHearingId : plaintiffHearingId;
						const otherState = await getHearing(otherHearingId);

						if(otherState)
						{
							const plaintiffState = isPlaintiff ? newState : otherState;
							const defendantState = isPlaintiff ? otherState : newState;
							const combinedRuling = await runCombinedDeliberation(plaintiffState, defendantState);
							match.combined_ruling = combinedRuling;
						}
					}
					catch {}

					match.status = 'concluded';
				}

				await updateMatch(match);
			}
		}

		return NextResponse.json({
			messages: newMessages,
			phase: newState.phase,
			turn: newState.turn,
			total_turns: newState.total_turns,
			ruling: ruling ?? null,
		});
	}
	catch(err)
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
};
