import { createMatch } from '@/lib/services/multiplayerStore';
import { MultiplayerMatch, MatchPlayer } from '@/types/multiplayer';
import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function POST(req: NextRequest)
{
	const session = await auth0.getSession();
	if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

	const { case_id, case_name, side } = await req.json();

	const userId = session.user.sub;
	const userName = session.user.name ?? session.user.email ?? 'Unknown';
	const matchId = crypto.randomUUID();

	const player: MatchPlayer = {
		user_id: userId,
		user_name: userName,
		hearing_id: null,
		status: 'pending',
		ruling: null,
	};

	const match: MultiplayerMatch = {
		match_id: matchId,
		case_id,
		case_name,
		status: 'waiting',
		created_at: new Date().toISOString(),
		plaintiff: side === 'plaintiff' ? player : null,
		defendant: side === 'defendant' ? player : null,
	};

	await createMatch(match);
	return NextResponse.json({ match_id: matchId }, { status: 201 });
}
