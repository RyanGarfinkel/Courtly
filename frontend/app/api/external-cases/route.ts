import { run as runRetriever } from '@/lib/agents/retriever';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest)
{
	const { searchParams } = request.nextUrl;
	const q = searchParams.get('q') ?? '';
	const pageNumber = parseInt(searchParams.get('page') ?? '1', 10) || 1;
	const pageSize = parseInt(searchParams.get('limit') ?? '5', 10) || 5;
	const offset = (pageNumber - 1) * pageSize;

	if(!q)
		return NextResponse.json({ error: 'q is required' }, { status: 400 });

	try
	{
		const sources = await runRetriever(q, { limit: pageSize, offset });
		return NextResponse.json({ results: sources, page: pageNumber, page_size: pageSize });
	}
	catch
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
