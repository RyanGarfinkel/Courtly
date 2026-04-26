import { summarize as assistSummarize, answerQuestion as assistAnswer } from '@/lib/agents/hearingAssistant';
import { getHearing } from '@/lib/services/hearingStore';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

export async function POST(req: NextRequest)
{
	try
	{
		const { hearing_id, question } = await req.json();
		const state = await getHearing(hearing_id);
		if(!state) return NextResponse.json({ error: 'Hearing not found' }, { status: 404 });

		let answer: string;
		if(question?.trim())
			answer = await assistAnswer(question, state.messages, state.case_name, state.brief);
		else
			answer = await assistSummarize(state.messages, state.case_name, state.brief);

		return NextResponse.json({ answer });
	}
	catch(err)
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
