import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { getLatestDraft } from '@/lib/services/caseMemory';
import { notFound } from 'next/navigation';
import { CaseProvider } from '@/contexts/case';
import { Badge } from '@/components/ui/badge';
import { Case } from '@/types/case';
import { getDb } from '@/lib/mongo';
import Workspace from './workspace';

const getCase = async (id: string): Promise<Case | null> =>
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
};

type Side = 'plaintiff' | 'defendant';

type Props = {
	params: Promise<{ id: string }>;
	searchParams?: Promise<{ side?: string; match_id?: string }>;
};

const BriefPage = async ({ params, searchParams }: Props) =>
{
	const [{ id }, sp] = await Promise.all([params, searchParams ?? Promise.resolve({} as { side?: string; match_id?: string })]);
	const side: Side = sp.side === 'defendant' ? 'defendant' : 'plaintiff';
	const matchId = sp.match_id;
	const [c, initialDraft] = await Promise.all([getCase(id), getLatestDraft(id)]);
	if(!c) notFound();

	return (
		<main className='flex-1 px-8 py-10'>
			<div className='max-w-7xl mx-auto'>
				<Breadcrumb className='mb-8'>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href='/dashboard'>Cases</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href={`/cases/${c.id}`}>{c.name}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Brief</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className='mb-8'>
					<div className='flex items-center gap-3 mb-2'>
						{c.category && <Badge variant='secondary' className='rounded-sm text-[10px]'>{c.category}</Badge>}
						{c.year && <span className='text-xs text-muted-foreground'>{c.year}</span>}
						{c.citation && <span className='text-xs text-muted-foreground'>{c.citation}</span>}
					</div>
					<div className='flex items-center gap-3'>
						<h1 className='font-heading text-2xl font-bold'>{c.name}</h1>
						<Badge
							variant={side === 'plaintiff' ? 'default' : 'secondary'}
							className='rounded-sm text-[10px]'
						>
							{side === 'plaintiff' ? 'Petitioner' : 'Respondent'}
						</Badge>
					</div>
				</div>

				<CaseProvider case_={c}>
					<Workspace initialDraft={initialDraft} side={side} matchId={matchId} />
				</CaseProvider>
			</div>
		</main>
	);
};

export default BriefPage;
