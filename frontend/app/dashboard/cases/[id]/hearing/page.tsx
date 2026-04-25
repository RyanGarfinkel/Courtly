import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import HearingRoom from './hearing-room';
import { notFound } from 'next/navigation';

interface Case
{
	id: string;
	name: string;
	year: number;
	category: string;
	summary: string;
	citation: string;
}

async function getCase(id: string): Promise<Case | null>
{
	try
	{
		const res = await fetch(`${process.env.API_URL ?? 'http://localhost:8000'}/cases`, { cache: 'no-store' });
		if(!res.ok) return null;
		const cases: Case[] = await res.json();
		return cases.find(c => c.id === id) ?? null;
	}
	catch
	{
		return null;
	}
}

type Props = {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ hearing_id?: string; side?: string }>;
};

export default async function HearingPage({ params, searchParams }: Props)
{
	const { id } = await params;
	const { hearing_id, side } = await searchParams;
	const c = await getCase(id);

	if(!c || !hearing_id) notFound();

	return (
		<main className="flex-1 flex flex-col px-8 py-10">
			<div className="max-w-4xl mx-auto w-full flex flex-col flex-1">
				<Breadcrumb className="mb-6">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/dashboard">Cases</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href={`/dashboard/cases/${c.id}`}>{c.name}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Oral Argument</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<HearingRoom
					case_={c}
					hearingId={hearing_id}
					side={(side as 'plaintiff' | 'defendant') ?? 'plaintiff'}
				/>
			</div>
		</main>
	);
}
