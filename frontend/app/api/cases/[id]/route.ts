import { seedIfEmpty, clSearch, caseId, mapCl } from '@/lib/services/caseService';
import { searchOpinions, getClusterJudges } from '@/lib/courtlistener';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/mongo';

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
)
{
	const { id } = await params;

	try
	{
		const db = await getDb();
		const cached = await db.collection('cases').findOne({ id }, { projection: { _id: 0 } });

		if(cached)
			return NextResponse.json(cached);

		try
		{
			const results = await searchOpinions(id.replace(/-/g, ' '), { limit: 1 });
			if(results.length > 0)
			{
				const mapped = await mapCl(results[0]);
				if(mapped)
				{
					await db.collection('cases').replaceOne({ id }, mapped, { upsert: true });
					return NextResponse.json(mapped);
				}
			}
		}
		catch
		{
		}

		return NextResponse.json({ error: 'Case not found' }, { status: 404 });
	}
	catch
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
