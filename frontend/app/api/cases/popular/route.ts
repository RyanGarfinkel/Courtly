import { seedIfEmpty, clSearch, caseId, mapCl } from '@/lib/services/caseService';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo';

export async function GET(request: NextRequest)
{
	const { searchParams } = request.nextUrl;
	const raw = parseInt(searchParams.get('limit') ?? '6', 10);
	const limit = Math.min(Math.max(isNaN(raw) ? 6 : raw, 1), 24);

	try
	{
		await seedIfEmpty();
		const db = await getDb();
		const docs = await db.collection('cases')
			.aggregate([
				{ $match: { created_by: { $exists: false } } },
				{ $sample: { size: limit } },
				{ $project: { _id: 0 } },
			])
			.toArray();
		return NextResponse.json({ cases: docs });
	}
	catch(e)
	{
		console.error('[/api/cases/popular]', e);
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
