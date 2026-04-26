import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getDb } from '@/lib/mongo';

export async function GET()
{
	const session = await auth0.getSession();
	if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const userId = session.user.sub;

	try
	{
		const db = await getDb();
		const matches = await db.collection('multiplayer_matches')
			.find(
				{ $or: [{ 'plaintiff.user_id': userId }, { 'defendant.user_id': userId }] },
				{ projection: { _id: 0 } }
			)
			.sort({ created_at: -1 })
			.limit(20)
			.toArray();

		return NextResponse.json(matches);
	}
	catch
	{
		return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
	}
}
