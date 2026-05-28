import { HearingRecord, JudicialStats } from '@/types/record';
import { getDb } from '@/lib/mongo';

let indexEnsured = false;

const ensureIndexes = async () =>
{
	if(indexEnsured) return;
	try
	{
		const db = await getDb();
		await db.collection('hearing_records').createIndex({ hearing_id: 1 }, { unique: true });
		indexEnsured = true;
	}
	catch {}
};

export const saveRecord = async (record: HearingRecord): Promise<void> =>
{
	await ensureIndexes();
	const db = await getDb();
	await db.collection('hearing_records').replaceOne(
		{ hearing_id: record.hearing_id },
		record,
		{ upsert: true }
	);
};

export const getRecordsByUser = async (userId: string, limit = 20): Promise<HearingRecord[]> =>
{
	await ensureIndexes();
	const db = await getDb();
	return db.collection('hearing_records')
		.find({ user_id: userId }, { projection: { _id: 0 } })
		.sort({ argued_at: -1 })
		.limit(limit)
		.toArray() as unknown as HearingRecord[];
};

export const getRecordByHearingId = async (hearingId: string): Promise<HearingRecord | null> =>
{
	await ensureIndexes();
	const db = await getDb();
	const doc = await db.collection('hearing_records').findOne(
		{ hearing_id: hearingId },
		{ projection: { _id: 0 } }
	);
	if(!doc) return null;
	return doc as unknown as HearingRecord;
};

export const computeStats = async (userId: string): Promise<JudicialStats> =>
{
	await ensureIndexes();
	const db = await getDb();

	const records = await db.collection('hearing_records')
		.find({ user_id: userId }, { projection: { _id: 0 } })
		.sort({ argued_at: -1 })
		.toArray() as unknown as HearingRecord[];

	const total_cases = records.length;

	if(total_cases === 0)
	{
		return {
			total_cases: 0,
			wins: 0,
			losses: 0,
			win_rate: 0,
			avg_overall_score: 0,
			avg_consistency: 0,
			avg_precedent: 0,
			avg_responsiveness: 0,
			recent_records: [],
			by_category: {},
		};
	}

	const wins = records.filter(r => r.result === 'affirmed').length;
	const losses = total_cases - wins;
	const win_rate = wins / total_cases;

	const avg_overall_score = records.reduce((s, r) => s + r.scores.overall, 0) / total_cases;
	const avg_consistency = records.reduce((s, r) => s + r.scores.consistency, 0) / total_cases;
	const avg_precedent = records.reduce((s, r) => s + r.scores.precedent, 0) / total_cases;
	const avg_responsiveness = records.reduce((s, r) => s + r.scores.responsiveness, 0) / total_cases;

	const by_category: Record<string, { wins: number; losses: number }> = {};
	for(const r of records)
	{
		const cat = r.case_category ?? 'Uncategorized';
		if(!by_category[cat]) by_category[cat] = { wins: 0, losses: 0 };
		if(r.result === 'affirmed') by_category[cat].wins++;
		else by_category[cat].losses++;
	}

	const recent_records = records.slice(0, 5);

	return {
		total_cases,
		wins,
		losses,
		win_rate,
		avg_overall_score,
		avg_consistency,
		avg_precedent,
		avg_responsiveness,
		recent_records,
		by_category,
	};
};
