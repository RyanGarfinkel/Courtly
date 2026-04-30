import { seedIfEmpty, clSearch, caseId, mapCl } from '@/lib/services/caseService';
import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getDb } from '@/lib/mongo';

export async function GET(request: NextRequest)
{
	const { searchParams } = request.nextUrl;
	const q = searchParams.get('q') ?? '';
	const name = searchParams.get('name') ?? '';
	const category = searchParams.get('category') ?? '';
	const yearFrom = searchParams.get('year_from') ?? '';
	const yearTo = searchParams.get('year_to') ?? '';
	const keyword = searchParams.get('keyword') ?? '';
	const exclude = searchParams.get('exclude') ?? '';
	const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
	const limitRaw = parseInt(searchParams.get('limit') ?? '5', 10);
	const n = isNaN(limitRaw) ? 5 : limitRaw;

	if(!q && !name && !category && !yearFrom && !yearTo && !keyword)
	{
		return NextResponse.json({ cases: [], query: '', page: 1, page_size: n, total_count: 0, total_pages: 0 });
	}

	const searchQuery = q || name || keyword || '';
	const excludeIds = exclude ? new Set(exclude.split(',')) : new Set<string>();

	try
	{
		const db = await getDb();
		const mongoDocs = await db.collection('cases')
			.find({ name: { $regex: searchQuery, $options: 'i' } }, { projection: { _id: 0 } })
			.limit(n + excludeIds.size)
			.toArray();

		const mongoResults = mongoDocs.filter((c: any) => !excludeIds.has(c.id));

		if(mongoResults.length > 0)
		{
			const sliced = mongoResults.slice(0, n);
			return NextResponse.json({
				cases: sliced,
				query: searchQuery,
				page,
				page_size: n,
				total_count: mongoResults.length,
				total_pages: 1,
			});
		}

		let cases: any[];
		try
		{
			const clResults = await clSearch(searchQuery, n + excludeIds.size);
			cases = clResults.filter((c: any) => !excludeIds.has(c.id)).slice(0, n);
		}
		catch
		{
			cases = mongoResults;
		}

		return NextResponse.json({
			cases,
			query: searchQuery,
			page,
			page_size: n,
			total_count: cases.length,
			total_pages: cases.length > 0 ? 1 : 0,
		});
	}
	catch
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}

export async function POST(request: NextRequest)
{
	try
	{
		const body = await request.json();
		const { name, summary, category = 'Custom', year = 0, citation = '' } = body;

		if(!name || !summary)
			return NextResponse.json({ error: 'name and summary are required' }, { status: 400 });

		const session = await auth0.getSession();
		const userId = session?.user?.sub ?? null;

		const id = caseId(name);
		const db = await getDb();
		const existing = await db.collection('cases').findOne({ id }, { projection: { _id: 0 } });

		if(existing)
			return NextResponse.json(existing);

		const newCase: Record<string, unknown> = { id, name, summary, category, year, citation };
		if(userId) newCase.created_by = userId;

		await db.collection('cases').insertOne({ ...newCase });
		return NextResponse.json({ id, name, summary, category, year, citation }, { status: 201 });
	}
	catch
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
