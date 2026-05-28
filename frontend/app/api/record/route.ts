import { computeStats } from '@/lib/services/recordStore';
import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export const GET = async () =>
{
	const session = await auth0.getSession();
	if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
	const stats = await computeStats(session.user.sub);
	return NextResponse.json(stats);
};
