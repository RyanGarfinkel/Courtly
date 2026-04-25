import CasesGrid from "./cases-grid";

interface Case
{
	id: string;
	name: string;
	year: number;
	category: string;
	summary: string;
	citation: string;
}

interface CasesResponse
{
	cases: Case[];
	query: string;
	page: number;
	page_size: number;
	total_count: number;
	total_pages: number;
}

async function getCases(query: string, page: number, limit: number, extra?: Record<string, string | undefined>): Promise<CasesResponse>
{
	const url = new URL(`${process.env.API_URL ?? "http://localhost:8000"}/cases`);

	if(query) url.searchParams.set("q", query);
	url.searchParams.set("page", String(page));
	url.searchParams.set("limit", String(limit));

	if(extra)
	{
		Object.entries(extra).forEach(([k, v]) => {
			if(v) url.searchParams.set(k, v);
		});
	}

	const res = await fetch(url.toString(), { cache: "no-store" });
	if(!res.ok)
	{
		return {
			cases: [],
			query,
			page,
			page_size: limit,
			total_count: 0,
			total_pages: 0,
		};
	}

	return res.json();
}

type SearchParams = {
	q?: string;
	page?: string;
	category?: string;
	name?: string;
	year_from?: string;
	year_to?: string;
	keyword?: string;
	judges?: string;
	plaintiff?: string;
	defendant?: string;
};

const PAGE_SIZE = 5;

export default async function Dashboard({ searchParams }: { searchParams?: Promise<SearchParams> })
{
	const params = await searchParams;
	const query = params?.q?.trim() ?? "";
	const rawPage = Number(params?.page ?? "1");
	const page = Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1;
	const extras: Record<string, string | undefined> = {
		category: params?.category,
		name: params?.name,
		year_from: params?.year_from,
		year_to: params?.year_to,
		keyword: params?.keyword,
		judges: params?.judges,
		plaintiff: params?.plaintiff,
		defendant: params?.defendant,
	};

	const data = await getCases(query, page, PAGE_SIZE, extras);

	return (
		<main className="flex-1 px-8 py-10">
			<div className="max-w-5xl mx-auto">
				<p className="text-muted-foreground mb-6">Select a case to bring before the court.</p>
				<CasesGrid
					key={`${data.query}-${data.page}`}
					cases={data.cases}
					page={data.page}
					totalCount={data.total_count}
					totalPages={data.total_pages}
					pageSize={data.page_size}
				/>
			</div>
		</main>
	);
}
