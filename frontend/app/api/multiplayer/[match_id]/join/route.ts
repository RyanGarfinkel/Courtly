import { getMatch, updateMatch } from '@/lib/services/multiplayerStore';
import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(
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
	const userName = session.user.name ?? session.user.email ?? 'Unknown';

	const alreadyIn =
		match.plaintiff?.user_id === userId ||
		match.defendant?.user_id === userId;

	if(alreadyIn) return NextResponse.json({ error: 'Already in this match' }, { status: 409 });

	let side: 'plaintiff' | 'defendant';

	if(!match.defendant)
	{
		side = 'defendant';
		match.defendant = {
			user_id: userId,
			user_name: userName,
			hearing_id: null,
			status: 'pending',
			ruling: null,
		};
	}
	else if(!match.plaintiff)
	{
		side = 'plaintiff';
		match.plaintiff = {
			user_id: userId,
			user_name: userName,
			hearing_id: null,
			status: 'pending',
			ruling: null,
		};
	}
	else
	{
		return NextResponse.json({ error: 'Match is full' }, { status: 409 });
	}

	match.status = 'active';
	await updateMatch(match);

	return NextResponse.json({
		side,
		case_id: match.case_id,
		case_name: match.case_name,
		match_id: match.match_id,
	});
}
