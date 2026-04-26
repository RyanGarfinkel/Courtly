import { getCachedResearch, saveResearch } from '@/lib/services/caseMemory';
import { run as runRetriever } from '@/lib/agents/retriever';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest)
{
	const { searchParams } = request.nextUrl;
	const caseId = searchParams.get('case_id') ?? '';
	const q = searchParams.get('q') ?? '';

	if(!caseId || !q)
		return NextResponse.json({ error: 'case_id and q are required' }, { status: 400 });

	try
	{
		const cached = await getCachedResearch(caseId);
		if(cached !== null)
			return NextResponse.json(cached);

		const sources = await runRetriever(q);
		await saveResearch(caseId, sources);
		return NextResponse.json(sources);
	}
	catch
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
