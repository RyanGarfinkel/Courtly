import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { notFound } from 'next/navigation';
import ResultsContent from './results-content';
import { getDb } from '@/lib/mongo';
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

export default async function ResultsPage({ params, searchParams }: Props)
{
	const { id } = await params;
	const { hearing_id, side } = await searchParams;
	const c = await getCase(id);

	if(!c || !hearing_id) notFound();

	return (
		<main className="px-8 py-6">
			<div className="max-w-4xl mx-auto w-full flex flex-col">
				<Breadcrumb className="mb-6">
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
							<BreadcrumbLink href={`/cases/${c.id}/hearing?hearing_id=${hearing_id}&side=${side}`}>
								Oral Argument
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Decision</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<ResultsContent
					hearingId={hearing_id}
					side={(side as 'plaintiff' | 'defendant') ?? 'plaintiff'}
				/>
			</div>
		</main>
	);
}
