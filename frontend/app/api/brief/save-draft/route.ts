import { saveDraft, getLatestDraft } from '@/lib/services/caseMemory';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest)
{
	try
	{
		const body = await request.json();
		const caseId: string = body.case_id;
		const content: string = body.content;

		await saveDraft(caseId, content);
		return NextResponse.json({ saved: true });
	}
	catch(error)
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
