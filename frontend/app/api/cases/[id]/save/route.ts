import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { getDb } from '@/lib/mongo';

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> })
{
	const session = await auth0.getSession();
	if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const userId = session.user.sub;
	const { id: caseId } = await params;
	const db = await getDb();

	const existing = await db.collection('saved_cases').findOne({ user_id: userId, case_id: caseId });

	if(existing)
	{
		await db.collection('saved_cases').deleteOne({ user_id: userId, case_id: caseId });
		return NextResponse.json({ saved: false });
	}

	await db.collection('saved_cases').insertOne({ user_id: userId, case_id: caseId, saved_at: new Date() });
	return NextResponse.json({ saved: true });
}
