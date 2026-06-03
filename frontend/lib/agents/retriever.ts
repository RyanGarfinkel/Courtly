import { searchOpinions } from '@/lib/courtlistener';
import { LegalSource, Citation } from '@/types/legal';
import { generateText } from '@/lib/gemini';

const TOPIC_PROMPT = `You are a legal research assistant. Given a landmark case name, output a short search phrase (4–8 words) describing the core legal issue or constitutional question the case addresses. This phrase will be used to search a legal opinion database for related precedents.

Case: {case_name}

Respond with only the search phrase, nothing else.`;

const QUOTE_PROMPT = `You are a legal research assistant. Extract the single most legally significant quote from the case snippet below — a direct statement of law, constitutional principle, or judicial reasoning relevant to the topic.

Topic: {topic}

Case: {case_name}
Snippet: {snippet}

Respond in this exact format:
QUOTE: <exact verbatim quote from the snippet>
EXPLANATION: <one sentence on why this quote matters for the topic>

If the snippet is only procedural boilerplate or contains no substantive legal reasoning at all, respond:
QUOTE: none
EXPLANATION: none`;

const extractSnippet = (result: any): string =>
{
	const opinions: any[] = result.opinions ?? [];
	return opinions
		.map((o: any) => (o.snippet ?? '').trim())
		.filter((s: string) => s.length > 0)
		.join('\n\n');
};

export const run = async (
	query: string,
	options?: { court?: string; limit?: number; offset?: number; beforeYear?: number }
): Promise<LegalSource[]> =>
{
	const court = options?.court ?? 'scotus';
	const limit = options?.limit ?? 5;
	const offset = options?.offset ?? 0;
	const beforeYear = options?.beforeYear;
	const page = Math.floor(offset / limit) + 1;

	const topicPhrase = (await generateText(TOPIC_PROMPT.replace('{case_name}', query))).trim();

	const raw = await searchOpinions(topicPhrase, { court, limit: limit + 10, offset: (page - 1) * limit });
	const normalizedQuery = query.toLowerCase().replace(/[^a-z0-9]/g, '');

	const results = raw
		.filter(r =>
		{
			const name = (r.caseName ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');
			if(name === normalizedQuery) return false;
			if(!extractSnippet(r)) return false;
			if(beforeYear && r.dateFiled)
			{
				const year = parseInt(r.dateFiled.slice(0, 4), 10);
				if(!isNaN(year) && year >= beforeYear) return false;
			}
			return true;
		})
		.slice(0, limit);

	const sources: LegalSource[] = [];

	for(const result of results)
	{
		const snippet = extractSnippet(result);
		const caseName: string = result.caseName ?? 'Unknown';
		const citations: string[] = result.citation ?? [];
		const dateFiled: string = result.dateFiled ?? '';
		const absoluteUrl: string = result.absolute_url ?? '';

		let year: number | null = null;
		if(dateFiled)
		{
			const parsed = parseInt(dateFiled.slice(0, 4), 10);
			if(!isNaN(parsed)) year = parsed;
		}

		const citation: Citation = {
			case_name: caseName,
			citation: citations[0] ?? null,
			court: result.court_id ?? null,
			year,
			url: absoluteUrl ? `https://www.courtlistener.com${absoluteUrl}` : null,
		};

		const prompt = QUOTE_PROMPT
			.replace('{topic}', topicPhrase)
			.replace('{case_name}', caseName)
			.replace('{snippet}', snippet);

		const response = await generateText(prompt);

		const quoteMatch = response.match(/QUOTE:\s*([\s\S]+?)(?=\nEXPLANATION:|$)/);
		const explanationMatch = response.match(/EXPLANATION:\s*([\s\S]+?)$/);

		let quote = quoteMatch?.[1]?.trim() ?? '';
		let explanation = explanationMatch?.[1]?.trim() ?? '';

		if(quote === 'none' || quote === '')
		{
			quote = '';
			explanation = 'No relevant content found in snippet.';
		}

		sources.push({ citation, relevant_quote: quote, relevance_explanation: explanation });
	}

	return sources;
};
