import { clSearch } from "@/lib/services/caseService";
import { Case } from "@/types/case";
import { getDb } from "@/lib/mongo";
import { auth0 } from "@/lib/auth0";
import CasesGrid from "./cases-grid";

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
	const empty = { cases: [], query, page, page_size: limit, total_count: 0, total_pages: 0 };
	const searchQuery = query || extra?.name || extra?.keyword || '';

	if(!searchQuery && !extra?.category && !extra?.year_from && !extra?.year_to)
		return empty;

	try
	{
		const db = await getDb();
		const mongoResults = (await db.collection('cases')
			.find({ name: { $regex: searchQuery, $options: 'i' } }, { projection: { _id: 0 } })
			.limit(limit)
			.toArray()) as unknown as Case[];

		if(mongoResults.length)
			return { cases: mongoResults, query: searchQuery, page, page_size: limit, total_count: mongoResults.length, total_pages: 1 };

		const cases = await clSearch(searchQuery, limit);
		return { cases: cases as unknown as Case[], query: searchQuery, page, page_size: limit, total_count: cases.length, total_pages: cases.length ? 1 : 0 };
	}
	catch
	{
		return empty;
	}
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

const PAGE_SIZE = 6;

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
	const session = await auth0.getSession();
	const userId = session?.user?.sub ?? null;

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
					userId={userId}
				/>
			</div>
		</main>
	);
}
