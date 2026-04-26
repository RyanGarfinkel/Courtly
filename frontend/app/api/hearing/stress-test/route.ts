import { getHearing } from '@/lib/services/hearingStore';
import { analyze } from '@/lib/agents/stressTest';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest)
{
	try
	{
		const { hearing_id, question, draft } = await req.json();
		const state = await getHearing(hearing_id);
		if(!state) return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });

		const result = await analyze(question, draft, state.brief, state.case_name);
		return NextResponse.json(result);
	}
	catch(err)
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
