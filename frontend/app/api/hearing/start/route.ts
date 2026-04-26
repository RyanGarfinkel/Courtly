import { start as orchestrateStart } from '@/lib/orchestrators/hearing';
import { createHearing } from '@/lib/services/hearingStore';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest)
{
	try
	{
		const { case_id, case_name, case_summary, brief, side } = await req.json();
		const [state, messages] = await orchestrateStart(case_id, case_name, case_summary, brief, side);
		await createHearing(state);
		return NextResponse.json({
			hearing_id: state.hearing_id,
			messages,
			phase: state.phase,
			turn: state.turn,
			total_turns: state.total_turns,
		});
	}
	catch(err)
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
