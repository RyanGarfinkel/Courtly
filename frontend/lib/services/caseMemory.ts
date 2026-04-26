import { getDb } from '@/lib/mongo';

export async function saveDraft(caseId: string, content: string): Promise<void>
{
	const db = await getDb();
	await db.collection('drafts').replaceOne(
		{ case_id: caseId },
		{ case_id: caseId, content, saved_at: new Date() },
		{ upsert: true }
	);
}

export async function getLatestDraft(caseId: string): Promise<string | null>
{
	const db = await getDb();
	const doc = await db.collection('drafts').findOne({ case_id: caseId }, { projection: { _id: 0 } });
	return doc ? (doc.content as string) : null;
}

export async function saveResearch(caseId: string, sources: any[]): Promise<void>
{
	const db = await getDb();
	await db.collection('research').replaceOne(
		{ case_id: caseId },
		{ case_id: caseId, sources, cached_at: new Date() },
		{ upsert: true }
	);
}

export async function getCachedResearch(caseId: string): Promise<any[] | null>
{
	const db = await getDb();
	const doc = await db.collection('research').findOne({ case_id: caseId }, { projection: { _id: 0 } });
	return doc ? (doc.sources as any[]) : null;
}
