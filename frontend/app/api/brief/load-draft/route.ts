import { saveDraft, getLatestDraft } from '@/lib/services/caseMemory';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest)
{
	try
	{
		const caseId = request.nextUrl.searchParams.get('case_id');
		const content = await getLatestDraft(caseId ?? '');
		return NextResponse.json({ draft: content });
	}
	catch(error)
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
