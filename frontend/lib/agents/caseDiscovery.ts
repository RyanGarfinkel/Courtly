import { searchOpinions } from '@/lib/courtlistener';

function slugify(name: string): string
{
	return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function stripHtml(text: string): string
{
	return text.replace(/<[^>]+>/g, '').trim();
}

export async function run(query: string, limit: number = 9): Promise<any[]>
{
	const results = await searchOpinions(query, { court: 'scotus', limit });
	const cases: any[] = [];

	for(const r of results)
	{
		const name = (r.caseName ?? '').trim();
		if(!name) continue;

		const dateFiled: string = r.dateFiled ?? '';
		let year = 0;
		if(dateFiled)
		{
			const parsed = parseInt(dateFiled.slice(0, 4), 10);
			if(!isNaN(parsed)) year = parsed;
		}

		const citations: string[] = r.citation ?? [];
		const snippet = stripHtml((r.snippet ?? '').trim());
		const url: string = r.absolute_url ?? '';

		cases.push({
			id: slugify(name),
			name,
			year,
			category: 'SCOTUS',
			summary: snippet || 'No summary available.',
			citation: citations[0] ?? '',
			url: url ? `https://www.courtlistener.com${url}` : '',
			source: 'courtlistener',
		});
	}

	return cases;
}
