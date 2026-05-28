import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { searchOpinions } from '@/lib/courtlistener';
import { mapCl } from '@/lib/services/caseService';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { Case } from '@/types/case';
import ChallengeButton from './challenge-button';
import { getDb } from '@/lib/mongo';
import Link from 'next/link';
import { marked } from 'marked';

const getCase = async (id: string): Promise<Case | null> =>
{
	try
	{
		const db = await getDb();
		const cached = await db.collection('cases').findOne({ id }, { projection: { _id: 0 } });
		if(cached) return cached as unknown as Case;

		const results = await searchOpinions(id.replace(/-/g, ' '), { limit: 1 });
		if(results.length)
		{
			const mapped = await mapCl(results[0]);
			if(mapped)
			{
				await db.collection('cases').replaceOne({ id: mapped.id }, mapped, { upsert: true });
				return mapped as unknown as Case;
			}
		}
		return null;
	}
	catch
	{
		return null;
	}
};

type Props = { params: Promise<{ id: string }> };

const CasePage = async ({ params }: Props) =>
{
	const { id } = await params;
	const c = await getCase(id);
	if(!c) notFound();

	return (
		<main className='flex-1 px-8 py-10'>
			<div className='max-w-4xl mx-auto'>
				<Breadcrumb className='mb-10'>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href='/dashboard'>Cases</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>{c.name}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				{c.category && (
					<p className='label-caps text-muted-foreground mb-4'>{c.category}</p>
				)}

				<h1 className='case-headline text-foreground mb-5'>
					{c.name}
				</h1>

				<div className='flex flex-wrap items-center gap-4 mb-6'>
					{c.citation && (
						<span className='text-sm text-muted-foreground font-medium'>{c.citation}</span>
					)}
					{c.year && (
						<>
							<span className='text-muted-foreground/40'>·</span>
							<span className='text-sm text-muted-foreground'>{c.year}</span>
						</>
					)}
					{c.court_listener_link && (
						<>
							<span className='text-muted-foreground/40'>·</span>
							<a
								href={c.court_listener_link}
								target='_blank'
								rel='noreferrer'
								className='text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded'
							>
								CourtListener
								<ExternalLink className='w-3.5 h-3.5' />
							</a>
						</>
					)}
				</div>

				<div className='section-rule' />

				<div
					className='prose prose-slate max-w-none text-foreground/80 leading-relaxed text-base mb-14'
					style={{ fontFamily: 'var(--font-sans)' }}
					dangerouslySetInnerHTML={{ __html: marked.parse(c.summary) as string }}
				/>

				<div className='border border-border rounded-sm overflow-hidden mb-6'>
					<div className='grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border'>
						<Link
							href={`/cases/${c.id}/brief?side=plaintiff`}
							className='group flex flex-col gap-3 p-8 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
						>
							<p className='label-caps text-muted-foreground'>Petitioner</p>
							<h2 className='font-heading text-xl font-bold text-foreground group-hover:text-primary transition-colors'>
								Argue for Petitioner
							</h2>
							<p className='text-sm text-muted-foreground leading-relaxed'>
								Represent the party bringing the appeal. Your burden is to show the lower court erred.
							</p>
							<span className='text-sm font-medium text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity'>
								Begin as Petitioner →
							</span>
						</Link>

						<Link
							href={`/cases/${c.id}/brief?side=defendant`}
							className='group flex flex-col gap-3 p-8 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
						>
							<p className='label-caps text-muted-foreground'>Respondent</p>
							<h2 className='font-heading text-xl font-bold text-foreground group-hover:text-primary transition-colors'>
								Argue for Respondent
							</h2>
							<p className='text-sm text-muted-foreground leading-relaxed'>
								Defend the lower court's ruling. Your burden is to show the judgment should stand.
							</p>
							<span className='text-sm font-medium text-primary mt-2 opacity-0 group-hover:opacity-100 transition-opacity'>
								Begin as Respondent →
							</span>
						</Link>
					</div>
				</div>

				<ChallengeButton caseId={c.id} caseName={c.name} />
			</div>
		</main>
	);
};

export default CasePage;
