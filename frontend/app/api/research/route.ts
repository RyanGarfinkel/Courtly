import { getCachedResearch, saveResearch, clearResearch } from '@/lib/services/caseMemory';
import { run as runRetriever } from '@/lib/agents/retriever';
import { NextRequest, NextResponse } from 'next/server';

export const GET = async (request: NextRequest) =>
{
	const { searchParams } = request.nextUrl;
	const caseId = searchParams.get('case_id') ?? '';
	const q = searchParams.get('q') ?? '';
	const force = searchParams.get('force') === 'true';
	const yearParam = searchParams.get('year');
	const beforeYear = yearParam ? parseInt(yearParam, 10) : undefined;

	if(!caseId || !q)
		return NextResponse.json({ error: 'case_id and q are required' }, { status: 400 });

	try
	{
		if(force)
			await clearResearch(caseId);

		const cached = await getCachedResearch(caseId);
		if(cached !== null)
			return NextResponse.json(cached);

		const sources = await runRetriever(q, { beforeYear });
		await saveResearch(caseId, sources);
		return NextResponse.json(sources);
	}
	catch
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
};
