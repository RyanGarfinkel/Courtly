import { draft, expandNotes, strengthen, counterarguments } from '@/lib/agents/briefWriter';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest)
{
	try
	{
		const body = await request.json();
		const content: string = body.content;
		const caseName: string = body.case_name;

		const result = await counterarguments(content, caseName);
		return NextResponse.json({ result });
	}
	catch(error)
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
