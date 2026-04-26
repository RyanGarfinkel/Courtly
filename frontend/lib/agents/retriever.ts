import { searchOpinions } from '@/lib/courtlistener';
import { generateText } from '@/lib/gemini';
import { LegalSource, Citation } from '@/types/legal';

const QUOTE_PROMPT = `You are a legal research assistant. Given a legal query and a case snippet, extract the single most relevant quote from the snippet that directly supports or addresses the query.

Query: {query}

Case: {case_name}
Snippet: {snippet}

Respond in this exact format:
QUOTE: <the exact quote from the snippet>
EXPLANATION: <one sentence on why this quote is relevant to the query>

If the snippet has no relevant content, respond:
QUOTE: none
EXPLANATION: none`;

export async function run(
	query: string,
	options?: { court?: string; limit?: number; offset?: number }
): Promise<LegalSource[]>
{
	const court = options?.court ?? 'scotus';
	const limit = options?.limit ?? 5;
	const offset = options?.offset ?? 0;
	const page = Math.floor(offset / limit) + 1;

	const results = await searchOpinions(query, { court, limit, offset: (page - 1) * limit });
	const sources: LegalSource[] = [];

	for(const result of results)
	{
		const snippet: string = (result.snippet ?? '').trim();
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

		if(!snippet)
		{
			sources.push({ citation, relevant_quote: '', relevance_explanation: 'No snippet available.' });
			continue;
		}

		const prompt = QUOTE_PROMPT
			.replace('{query}', query)
			.replace('{case_name}', caseName)
			.replace('{snippet}', snippet);

		const response = await generateText(prompt);
		let quote = '';
		let explanation = '';

		for(const line of response.split('\n'))
		{
			if(line.startsWith('QUOTE:')) quote = line.slice('QUOTE:'.length).trim();
			else if(line.startsWith('EXPLANATION:')) explanation = line.slice('EXPLANATION:'.length).trim();
		}

		if(quote === 'none')
		{
			quote = '';
			explanation = 'No relevant content found in snippet.';
		}

		sources.push({ citation, relevant_quote: quote, relevance_explanation: explanation });
	}

	return sources;
}
