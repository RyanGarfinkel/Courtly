import { HearingState } from '@/types/hearing';
import { getDb } from '@/lib/mongo';

export const createHearing = async (state: HearingState): Promise<void> =>
{
	const db = await getDb();
	await db.collection('hearings').replaceOne(
		{ hearing_id: state.hearing_id },
		state,
		{ upsert: true }
	);
};

export const getHearing = async (hearingId: string): Promise<HearingState | null> =>
{
	const db = await getDb();
	const doc = await db.collection('hearings').findOne(
		{ hearing_id: hearingId },
		{ projection: { _id: 0 } }
	);
	if(doc === null) return null;
	return doc as unknown as HearingState;
};

export const updateHearing = async (state: HearingState): Promise<void> =>
{
	await createHearing(state);
};
