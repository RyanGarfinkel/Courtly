import { processTurn } from '@/lib/orchestrators/hearing';
import { getHearing, updateHearing } from '@/lib/services/hearingStore';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest)
{
	try
	{
		const { hearing_id, user_response } = await req.json();
		const state = await getHearing(hearing_id);
		if(!state) return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });

		const [newState, newMessages, ruling] = await processTurn(state, user_response);
		await updateHearing(newState);
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
}
