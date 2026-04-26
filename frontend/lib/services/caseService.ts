import { searchOpinions, getClusterJudges } from '@/lib/courtlistener';
import { generateText } from '@/lib/gemini';
import { getDb } from '@/lib/mongo';
import crypto from 'crypto';

export function caseId(name: string): string
{
	return crypto.createHash('sha1').update(name.toLowerCase().trim()).digest('hex').slice(0, 10);
}

export async function expandSummary(name: string, snippet: string): Promise<string>
{
	const prompt = `Summarize the US Supreme Court case "${name}" in 3-4 paragraphs.
Cover: the facts and background, the central legal question, the Court's holding, and the broader significance.
Write in clear informative prose. No headers or bullet points.
Context from the opinion: ${snippet}`;
	try
	{
		return await generateText(prompt);
	}
	catch
	{
		return snippet;
	}
}

export async function mapCl(
	result: any,
	options?: { overrideId?: string; expand?: boolean }
): Promise<any | null>
{
	const name = (result.caseName ?? '').trim();
	if(!name) return null;

	const expand = options?.expand ?? true;

	let year: number | null = null;
	if(result.dateFiled)
	{
		const parsed = parseInt(result.dateFiled.slice(0, 4), 10);
		if(!isNaN(parsed)) year = parsed;
	}

	const citations: string[] = result.citation ?? [];
	const snippet = (result.snippet ?? '').replace(/<[^>]+>/g, '').trim();
	const rawUrl: string = result.absolute_url ?? '';
	const judgeStr: string = result.judge ?? '';

	let panel: string[] | null = null;
	if(!judgeStr && rawUrl)
	{
		panel = await getClusterJudges(rawUrl);
	}
	else
	{
		const names = judgeStr.split(',').map((n: string) => n.trim()).filter(Boolean);
		panel = names.length > 0 ? names : null;
	}

	const summary = expand ? await expandSummary(name, snippet) : snippet;

	return {
		id: options?.overrideId ?? caseId(name),
		name,
		year,
		category: result.suitNature || 'Supreme Court',
		summary,
		citation: citations[0] ?? '',
		court_listener_link: rawUrl ? `https://www.courtlistener.com${rawUrl}` : null,
		panel,
	};
}

export async function clSearch(query: string, limit = 5): Promise<any[]>
{
	const results = await searchOpinions(query, { limit });

	const unexpanded = await Promise.all(
		results.map((r: any) => mapCl(r, { expand: false }))
	);
	const valid = unexpanded.filter(Boolean) as any[];

	const expanded = await Promise.all(
		valid.map((c: any) => expandSummary(c.name, c.summary).then(summary => ({ ...c, summary })))
	);

	const seen = new Set<string>();
	const deduped = expanded.filter((c: any) =>
	{
		if(seen.has(c.id)) return false;
		seen.add(c.id);
		return true;
	});

	const db = await getDb();
	const col = db.collection('cases');
	await Promise.all(
		deduped.map((c: any) => col.replaceOne({ id: c.id }, c, { upsert: true }))
	);

	return deduped;
}

export async function seedIfEmpty(): Promise<void>
{
	const db = await getDb();
	const count = await db.collection('cases').countDocuments();
	if(count === 0)
	{
		const { run } = await import('@/lib/seed');
		await run();
	}
}
