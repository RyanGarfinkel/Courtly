const BASE_URL = 'https://www.courtlistener.com/api/rest/v4';

const getToken = (): string =>
{
	const token = process.env.COURTLISTENER_API_TOKEN;
	if(!token) throw new Error('COURTLISTENER_API_TOKEN is not set');
	return token;
};

export const searchOpinions = async (
	query: string,
	options?: { court?: string; limit?: number; offset?: number }
): Promise<any[]> =>
{
	const court = options?.court ?? 'scotus';
	const limit = options?.limit ?? 5;
	const offset = options?.offset ?? 0;
	const page = Math.floor(offset / limit) + 1;

	const url = `${BASE_URL}/search/?type=o&q=${encodeURIComponent(query)}&court=${court}&order_by=score+desc&page_size=${limit}&page=${page}`;

	try
	{
		const res = await fetch(url, {
			headers: { Authorization: `Token ${getToken()}` }
		});
		const json = await res.json();
		return json.results ?? [];
	}
	catch(e)
	{
		console.error('courtlistener searchOpinions error:', e);
		return [];
	}
};

export const getClusterJudges = async (absoluteUrl: string): Promise<string[] | null> =>
{
	const match = absoluteUrl.match(/\/opinion\/(\d+)\//);
	if(!match) return null;

	const clusterId = match[1];

	try
	{
		const res = await fetch(`${BASE_URL}/clusters/${clusterId}/?fields=judges`, {
			headers: { Authorization: `Token ${getToken()}` }
		});
		const json = await res.json();
		if(!json.judges) return null;
		return (json.judges as string).split(',').map((s: string) => s.trim()).filter(Boolean);
	}
	catch(e)
	{
		console.error('courtlistener getClusterJudges error:', e);
		return null;
	}
};
