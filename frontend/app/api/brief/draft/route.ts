import { draft, expandNotes, strengthen, counterarguments } from '@/lib/agents/briefWriter';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest)
{
	try
	{
		const body = await request.json();
		const caseName: string = body.case_name;
		const caseSummary: string = body.case_summary ?? '';
		const category: string = body.category ?? '';
		const year: number = body.year ?? 0;
		const citation: string = body.citation ?? '';
		const side: string = body.side ?? 'plaintiff';
		const userNotes: string = body.user_notes ?? '';

		const result = await draft(caseName, caseSummary, category, year, citation, side, userNotes);
		return NextResponse.json({ result });
	}
	catch(error)
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
