import { getMatch, updateMatch } from '@/lib/services/multiplayerStore';
import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ match_id: string }> }
)
{
	const session = await auth0.getSession();
	if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { match_id } = await params;
	const match = await getMatch(match_id);
	if(!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

	return NextResponse.json(match);
}

export async function DELETE(
	req: NextRequest,
	{ params }: { params: Promise<{ match_id: string }> }
)
{
	const session = await auth0.getSession();
	if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { match_id } = await params;
	const match = await getMatch(match_id);
	if(!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

	const userId = session.user.sub;
	const isParticipant =
		match.plaintiff?.user_id === userId ||
		match.defendant?.user_id === userId;
	if(!isParticipant) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

	if(match.status === 'concluded')
		return NextResponse.json({ error: 'Match already concluded' }, { status: 409 });

	match.status = 'cancelled';
	await updateMatch(match);
	return NextResponse.json({ success: true });
}
