import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { notFound } from 'next/navigation';
import { CaseProvider } from '@/contexts/case';
import { getDb } from '@/lib/mongo';
import HearingRoom from './hearing-room';
import { Case } from '@/types/case';

async function getCase(id: string): Promise<Case | null>
{
	try
	{
		const db = await getDb();
		const doc = await db.collection('cases').findOne({ id }, { projection: { _id: 0 } });
		return doc ? doc as unknown as Case : null;
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
		<main className="h-[calc(100vh-4rem)] flex flex-col px-8 py-6 overflow-hidden">
			<div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
				<Breadcrumb className="mb-4 shrink-0">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/dashboard">Cases</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href={`/cases/${c.id}`}>{c.name}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Oral Argument</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<CaseProvider case_={c}>
					<HearingRoom
						hearingId={hearing_id}
						side={(side as 'plaintiff' | 'defendant') ?? 'plaintiff'}
					/>
				</CaseProvider>
			</div>
		</main>
	);
}
