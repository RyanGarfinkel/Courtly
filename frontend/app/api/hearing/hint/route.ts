import { generateHints } from '@/lib/agents/hearingAssistant';
import { getHearing } from '@/lib/services/hearingStore';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest)
{
	try
	{
		const { hearing_id } = await req.json();
		const state = await getHearing(hearing_id);
		if(!state) return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });

		const lastQuestion = [...state.messages].reverse().find(m => m.type === 'question')?.content ?? '';
		const hints = await generateHints(lastQuestion, state.messages, state.case_name, state.brief);
		return NextResponse.json({ hints });
	}
	catch(err)
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
