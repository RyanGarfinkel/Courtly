import { MultiplayerMatch } from '@/types/multiplayer';
import { getDb } from '@/lib/mongo';

export const createMatch = async (match: MultiplayerMatch): Promise<void> =>
{
	const db = await getDb();
	await db.collection('multiplayer_matches').replaceOne(
		{ match_id: match.match_id },
		match,
		{ upsert: true }
	);
};

export const getMatch = async (matchId: string): Promise<MultiplayerMatch | null> =>
{
	const db = await getDb();
	const doc = await db.collection('multiplayer_matches').findOne(
		{ match_id: matchId },
		{ projection: { _id: 0 } }
	);
	if(doc === null) return null;
	return doc as unknown as MultiplayerMatch;
};

export const updateMatch = async (match: MultiplayerMatch): Promise<void> =>
{
	await createMatch(match);
};
