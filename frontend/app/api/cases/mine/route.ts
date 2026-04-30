import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getDb } from '@/lib/mongo';
import { Case } from '@/types/case';

export async function GET()
{
	const session = await auth0.getSession();
	if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const userId = session.user.sub;
	const db = await getDb();

	const customCases = await db.collection('cases')
		.find({ created_by: userId }, { projection: { _id: 0 } })
		.toArray();

	const savedDocs = await db.collection('saved_cases')
		.find({ user_id: userId })
		.toArray();

	const savedCases: Case[] = (
		await Promise.all(
			savedDocs.map((doc) =>
				db.collection('cases').findOne({ id: doc.case_id }, { projection: { _id: 0 } })
			)
		)
	).filter((c): c is Case => c !== null);

	return NextResponse.json({ custom: customCases, saved: savedCases });
}
