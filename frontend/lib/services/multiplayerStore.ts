import { MultiplayerMatch } from '@/types/multiplayer';
import { getDb } from '@/lib/mongo';

export async function createMatch(match: MultiplayerMatch): Promise<void>
{
	const db = await getDb();
	await db.collection('multiplayer_matches').replaceOne(
		{ match_id: match.match_id },
		match,
		{ upsert: true }
	);
}

export async function getMatch(matchId: string): Promise<MultiplayerMatch | null>
{
	const db = await getDb();
	const doc = await db.collection('multiplayer_matches').findOne(
		{ match_id: matchId },
		{ projection: { _id: 0 } }
	);
	if(doc === null) return null;
	return doc as unknown as MultiplayerMatch;
}

export async function updateMatch(match: MultiplayerMatch): Promise<void>
{
	await createMatch(match);
}
