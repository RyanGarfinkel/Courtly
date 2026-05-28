'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { BookmarkCheck, Search, Bookmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Case } from '@/types/case';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ExternalCase
{
	citation: {
		case_name: string;
		court?: string;
		year?: number;
		citation?: string;
		url?: string;
	};
	relevant_quote?: string;
	relevance_explanation?: string;
}

interface Props
{
	cases: Case[];
	page: number;
	totalCount: number;
	totalPages: number;
	pageSize: number;
	userId: string | null;
}

interface CaseRowProps
{
	c: Case;
	userId: string | null;
	saved: boolean;
	onToggleSave: (id: string) => void;
	index: number;
}

const CaseRow = ({ c, userId, saved, onToggleSave, index }: CaseRowProps) =>
{
	return (
		<Link
			href={`/cases/${c.id}`}
			className='group flex items-center gap-4 px-4 py-4 border-b border-border hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset animate-fade-in'
			style={{ animationDelay: `${index * 40}ms`, animationFillMode: 'both' }}
		>
			<div className='w-1 self-stretch rounded-full bg-border group-hover:bg-primary transition-colors shrink-0' />

			<div className='flex-1 min-w-0'>
				<p className='font-heading font-bold text-base leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-1'>
					{c.name}
				</p>
				<p className='text-xs text-muted-foreground mt-0.5 line-clamp-1'>{c.summary}</p>
			</div>

			<div className='flex items-center gap-3 shrink-0'>
				{c.category && (
					<Badge variant='secondary' className='text-[10px] px-2 py-0.5 rounded-sm hidden sm:flex'>
						{c.category}
					</Badge>
				)}
				{c.year && (
					<span className='text-xs text-muted-foreground tabular-nums hidden md:block'>{c.year}</span>
				)}
				{userId && (
					<button
						type='button'
						onClick={e =>
						{
							e.preventDefault();
							e.stopPropagation();
							onToggleSave(c.id);
						}}
						className={cn(
							'p-1 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
							saved ? 'text-primary' : 'text-muted-foreground hover:text-primary'
						)}
					>
						{saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
					</button>
				)}
				<span className='text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity'>
					Argue →
				</span>
			</div>
		</Link>
	);
};

const FeaturedTile = ({ pc, userId, saved, onToggleSave, index }: { pc: Case; userId: string | null; saved: boolean; onToggleSave: (id: string) => void; index: number }) =>
{
	return (
		<Link
			href={`/cases/${pc.id}`}
			className='group flex flex-col border border-border rounded-sm p-6 hover:bg-muted/30 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring animate-fade-in'
			style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'both' }}
		>
			<div className='flex items-center justify-between mb-3'>
				{pc.category && (
					<Badge variant='secondary' className='text-[10px] px-2 py-0.5 rounded-sm'>
						{pc.category}
					</Badge>
				)}
				<div className='flex items-center gap-2'>
					{pc.year && <span className='text-xs text-muted-foreground tabular-nums'>{pc.year}</span>}
					{userId && (
						<button
							type='button'
							onClick={e =>
							{
								e.preventDefault();
								e.stopPropagation();
								onToggleSave(pc.id);
							}}
							className={cn(
								'p-0.5 rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
								saved ? 'text-primary' : 'text-muted-foreground hover:text-primary'
							)}
						>
							{saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
						</button>
					)}
				</div>
			</div>

			<h3 className='font-heading font-bold text-lg leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-3 flex-1'>
				{pc.name}
			</h3>

			<p className='text-xs text-muted-foreground mt-3 line-clamp-3 leading-relaxed'>{pc.summary}</p>

			<div className='flex items-center justify-between mt-4 pt-3 border-t border-border'>
				<span className='text-xs text-muted-foreground'>{pc.citation}</span>
				<span className='text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity'>
					Argue →
				</span>
			</div>
		</Link>
	);
};

const SkeletonRow = () =>
{
	return (
		<div className='flex items-center gap-4 px-4 py-4 border-b border-border animate-pulse'>
			<div className='w-1 h-10 rounded-full bg-muted shrink-0' />
			<div className='flex-1 flex flex-col gap-1.5'>
				<div className='h-4 w-2/3 bg-muted rounded' />
				<div className='h-3 w-full bg-muted rounded' />
			</div>
			<div className='h-4 w-16 bg-muted rounded hidden sm:block' />
		</div>
	);
};

const SkeletonTile = () =>
{
	return (
		<div className='border border-border rounded-sm p-6 flex flex-col gap-3 animate-pulse'>
			<div className='h-4 w-16 bg-muted rounded' />
			<div className='h-5 w-4/5 bg-muted rounded' />
			<div className='h-5 w-3/5 bg-muted rounded' />
			<div className='h-3 w-full bg-muted rounded mt-2' />
			<div className='h-3 w-full bg-muted rounded' />
			<div className='h-3 w-4/5 bg-muted rounded' />
		</div>
	);
};

const CasesGrid = ({ cases: initialCases, page, totalCount, totalPages, pageSize, userId }: Props) =>
{
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const buildHref = useCallback((nextQuery: string, nextPage: number) =>
	{
		const params = new URLSearchParams(searchParams.toString());

		if(nextQuery) params.set('q', nextQuery);
		else params.delete('q');

		if(nextPage > 1) params.set('page', String(nextPage));
		else params.delete('page');

		return `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
	}, [pathname, searchParams]);

	const [searchQuery, setSearchQuery] = useState<string>(searchParams.get('q') ?? '');
	const [yearFrom, setYearFrom] = useState<string>(searchParams.get('year_from') ?? '');
	const [yearTo, setYearTo] = useState<string>(searchParams.get('year_to') ?? '');
	const [keyword, setKeyword] = useState<string>(searchParams.get('keyword') ?? '');

	const [externalResults, setExternalResults] = useState<ExternalCase[]>([]);
	const [externalPage, setExternalPage] = useState<number>(1);
	const [externalLoading, setExternalLoading] = useState<boolean>(false);

	const [popularCases, setPopularCases] = useState<Case[]>([]);
	const [popularLoading, setPopularLoading] = useState<boolean>(false);

	const [displayedCases, setDisplayedCases] = useState<Case[]>(initialCases);
	const [searchLoading, setSearchLoading] = useState(false);

	const [myCases, setMyCases] = useState<Case[]>([]);
	const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
	const [myLoading, setMyLoading] = useState(false);

	const isSearching = Boolean(searchQuery || yearFrom || yearTo || keyword);
	const showPopular = !isSearching && displayedCases.length === 0 && externalResults.length === 0;
	const showMyCases = !isSearching && !!userId;

	useEffect(() =>
	{
		Promise.resolve().then(() =>
		{
			setDisplayedCases(initialCases);
			setSearchLoading(false);
		});
	}, [initialCases]);

	useEffect(() =>
	{
		const trimmedQuery = searchQuery.trim();
		const nextHref = buildHref(trimmedQuery, 1);
		const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

		if(nextHref === currentHref) return;

		const timeout = window.setTimeout(() =>
		{
			setSearchLoading(true);
			router.replace(nextHref);
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [buildHref, pathname, router, searchQuery, searchParams]);

	useEffect(() =>
	{
		if(!showPopular) return;
		setPopularLoading(true);

		const load = async () =>
		{
			try
			{
				const res = await fetch(`${API_URL}/cases/popular?limit=6`);
				if(!res.ok) throw new Error();
				const data = await res.json();
				if(data.cases) setPopularCases(data.cases);
			}
			catch
			{
				setPopularCases([]);
			}
			finally
			{
				setPopularLoading(false);
			}
		};

		load();
	}, [showPopular]);

	useEffect(() =>
	{
		if(!showMyCases) return;
		setMyLoading(true);

		const load = async () =>
		{
			try
			{
				const res = await fetch('/api/cases/mine');
				if(!res.ok) throw new Error();
				const data = await res.json();
				const combined = [...(data.custom ?? []), ...(data.saved ?? [])];
				const seen = new Set<string>();
				const deduped = combined.filter(c =>
				{
					if(seen.has(c.id)) return false;
					seen.add(c.id);
					return true;
				});
				setMyCases(deduped);
				setSavedIds(new Set(deduped.map((c: Case) => c.id)));
			}
			catch
			{
				setMyCases([]);
			}
			finally
			{
				setMyLoading(false);
			}
		};

		load();
	}, [showMyCases]);

	const toggleSave = async (caseId: string) =>
	{
		const res = await fetch(`/api/cases/${caseId}/save`, { method: 'POST' });
		const data = await res.json();

		if(data.saved)
		{
			setSavedIds(prev => new Set(prev).add(caseId));
		}
		else
		{
			setSavedIds(prev =>
			{
				const next = new Set(prev);
				next.delete(caseId);
				return next;
			});
			setMyCases(prev => prev.filter(c => c.id !== caseId));
		}

		const refetch = await fetch('/api/cases/mine');
		if(refetch.ok)
		{
			const refreshed = await refetch.json();
			const combined = [...(refreshed.custom ?? []), ...(refreshed.saved ?? [])];
			const seen = new Set<string>();
			const deduped = combined.filter(c =>
			{
				if(seen.has(c.id)) return false;
				seen.add(c.id);
				return true;
			});
			setMyCases(deduped);
			setSavedIds(new Set(deduped.map((c: Case) => c.id)));
		}
	};

	const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
	const endIndex = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

	const applyAdvancedFilters = () =>
	{
		const params = new URLSearchParams(searchParams.toString());

		if(searchQuery) params.set('q', searchQuery);
		else params.delete('q');

		if(yearFrom) params.set('year_from', yearFrom);
		else params.delete('year_from');

		if(yearTo) params.set('year_to', yearTo);
		else params.delete('year_to');

		if(keyword) params.set('keyword', keyword);
		else params.delete('keyword');

		router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
	};

	const fetchExternal = async (pageNum = 1) =>
	{
		if(!searchQuery && !keyword) return;
		setExternalLoading(true);
		try
		{
			const q = searchQuery || keyword;
			const res = await fetch(`${API_URL}/external-cases?q=${encodeURIComponent(q)}&page=${pageNum}&limit=5`);
			if(!res.ok) throw new Error();
			const data = await res.json();
			if(pageNum === 1) setExternalResults(data.results || []);
			else setExternalResults(prev => [...prev, ...(data.results || [])]);
			setExternalPage(pageNum);
		}
		catch
		{
			// ignore
		}
		finally
		{
			setExternalLoading(false);
		}
	};

	const resetFilters = () =>
	{
		setSearchQuery('');
		setYearFrom('');
		setYearTo('');
		setKeyword('');
		setExternalResults([]);
		setDisplayedCases([]);
		router.replace(pathname);
	};

	return (
		<div className='flex flex-col gap-8'>
			<div className='flex flex-col lg:flex-row gap-4 items-start lg:items-center'>
				<div className='relative flex-1 w-full lg:max-w-lg'>
					<Search className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4' />
					<Input
						type='search'
						name='q'
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						placeholder='Search case name, topic, or citation...'
						className='pl-9 rounded-sm h-11'
					/>
				</div>

				<div className='flex items-center gap-2 flex-wrap'>
					{(isSearching || page > 1 || displayedCases.length > initialCases.length) && (
						<button
							type='button'
							onClick={resetFilters}
							className='inline-flex items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors h-10'
						>
							Reset
						</button>
					)}

					<Accordion type='single' collapsible className='w-auto'>
						<AccordionItem value='advanced' className='border-none'>
							<AccordionTrigger className='hover:no-underline py-0 h-10 px-4 border border-border rounded-sm text-sm'>
								Advanced
							</AccordionTrigger>
							<AccordionContent className='pt-4 absolute z-10 bg-background border border-border rounded-sm p-4 shadow-sm min-w-[280px]'>
								<div className='grid grid-cols-1 gap-2'>
									<Input placeholder='Keywords (comma separated)' value={keyword} onChange={e => setKeyword(e.target.value)} className='h-10 rounded-sm' />
									<Input placeholder='Year from' type='number' value={yearFrom} onChange={e => setYearFrom(e.target.value)} className='h-10 rounded-sm' />
									<Input placeholder='Year to' type='number' value={yearTo} onChange={e => setYearTo(e.target.value)} className='h-10 rounded-sm' />
								</div>
								<div className='flex items-center gap-2 pt-3'>
									<Button size='sm' className='rounded-sm' onClick={applyAdvancedFilters}>Apply</Button>
									<Button variant='ghost' size='sm' className='rounded-sm' onClick={() => fetchExternal(1)}>
										Search SCOTUS
									</Button>
								</div>
							</AccordionContent>
						</AccordionItem>
					</Accordion>
				</div>
			</div>

			{isSearching && searchLoading && (
				<div className='border border-border rounded-sm overflow-hidden'>
					{Array.from({ length: 4 }).map((_, i) => (
						<SkeletonRow key={i} />
					))}
				</div>
			)}

			{isSearching && !searchLoading && displayedCases.length === 0 && externalResults.length === 0 && (
				<p className='text-sm text-muted-foreground py-4'>No cases match your search.</p>
			)}

			{externalResults.length > 0 && (
				<div className='flex flex-col gap-3'>
					<p className='label-caps text-muted-foreground'>Supreme Court matches</p>
					<div className='border border-border rounded-sm overflow-hidden'>
						{externalResults.map((r, i) => (
							<div key={`${r.citation.case_name}-${i}`} className='flex items-center gap-4 px-4 py-4 border-b border-border last:border-0'>
								<div className='flex-1 min-w-0'>
									<p className='font-heading font-bold text-base leading-snug line-clamp-1'>{r.citation.case_name}</p>
									<p className='text-xs text-muted-foreground mt-0.5 line-clamp-1'>{r.relevant_quote || r.relevance_explanation}</p>
								</div>
								<div className='flex items-center gap-3 shrink-0'>
									{r.citation.court && (
										<Badge variant='secondary' className='text-[10px] rounded-sm hidden sm:flex'>{r.citation.court}</Badge>
									)}
									{r.citation.year && (
										<span className='text-xs text-muted-foreground tabular-nums hidden md:block'>{r.citation.year}</span>
									)}
									{r.citation.url && (
										<a
											href={r.citation.url}
											target='_blank'
											rel='noreferrer'
											className='text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded'
										>
											View →
										</a>
									)}
								</div>
							</div>
						))}
					</div>
					<Button size='sm' variant='outline' className='self-start rounded-sm' onClick={() => fetchExternal(externalPage + 1)} disabled={externalLoading}>
						{externalLoading ? 'Loading...' : 'More results'}
					</Button>
				</div>
			)}

			{displayedCases.length > 0 && (
				<div className='flex flex-col gap-1'>
					{totalCount > 0 && displayedCases.length === initialCases.length && (
						<p className='text-xs text-muted-foreground mb-3'>
							Showing {startIndex}–{endIndex} of {totalCount} cases
						</p>
					)}
					<div className='border border-border rounded-sm overflow-hidden'>
						{displayedCases.map((c, i) => (
							<CaseRow
								key={c.id}
								c={c}
								userId={userId}
								saved={savedIds.has(c.id)}
								onToggleSave={toggleSave}
								index={i}
							/>
						))}
					</div>
				</div>
			)}

			{showPopular && popularLoading && (
				<div className='flex flex-col gap-3'>
					<p className='label-caps text-muted-foreground'>Featured cases</p>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
						{Array.from({ length: 3 }).map((_, i) => (
							<SkeletonTile key={i} />
						))}
					</div>
				</div>
			)}

			{showPopular && !popularLoading && popularCases.length > 0 && (
				<div className='flex flex-col gap-3'>
					<p className='label-caps text-muted-foreground'>Featured cases</p>
					<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
						{popularCases.slice(0, 3).map((pc, i) => (
							<FeaturedTile
								key={pc.id}
								pc={pc}
								userId={userId}
								saved={savedIds.has(pc.id)}
								onToggleSave={toggleSave}
								index={i}
							/>
						))}
					</div>
					{popularCases.length > 3 && (
						<div className='border border-border rounded-sm overflow-hidden mt-2'>
							{popularCases.slice(3).map((c, i) => (
								<CaseRow
									key={c.id}
									c={c}
									userId={userId}
									saved={savedIds.has(c.id)}
									onToggleSave={toggleSave}
									index={i + 3}
								/>
							))}
						</div>
					)}
				</div>
			)}

			{showMyCases && myLoading && (
				<div className='flex flex-col gap-3'>
					<p className='label-caps text-muted-foreground'>My cases</p>
					<div className='border border-border rounded-sm overflow-hidden'>
						{Array.from({ length: 3 }).map((_, i) => (
							<SkeletonRow key={i} />
						))}
					</div>
				</div>
			)}

			{showMyCases && !myLoading && myCases.length === 0 && (
				<div className='flex flex-col gap-3'>
					<p className='label-caps text-muted-foreground'>My cases</p>
					<p className='text-sm text-muted-foreground py-4'>Save cases to build your docket.</p>
				</div>
			)}

			{showMyCases && !myLoading && myCases.length > 0 && (
				<div className='flex flex-col gap-3'>
					<p className='label-caps text-muted-foreground'>My cases</p>
					<div className='border border-border rounded-sm overflow-hidden'>
						{myCases.map((mc, i) => (
							<CaseRow
								key={mc.id}
								c={mc}
								userId={userId}
								saved={savedIds.has(mc.id)}
								onToggleSave={toggleSave}
								index={i}
							/>
						))}
					</div>
				</div>
			)}

			{totalPages > 1 && displayedCases.length === initialCases.length && (
				<div className='flex items-center justify-between gap-3 pt-2'>
					<p className='text-xs text-muted-foreground'>
						Page {page} of {totalPages}
					</p>
					<div className='flex items-center gap-2'>
						<Link
							href={buildHref(searchQuery, Math.max(1, page - 1))}
							aria-disabled={page <= 1}
							className={cn(
								'inline-flex items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
								page <= 1 ? 'pointer-events-none opacity-40' : 'hover:bg-muted'
							)}
						>
							Previous
						</Link>
						<Link
							href={buildHref(searchQuery, Math.min(totalPages, page + 1))}
							aria-disabled={page >= totalPages}
							className={cn(
								'inline-flex items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
								page >= totalPages ? 'pointer-events-none opacity-40' : 'hover:bg-muted'
							)}
						>
							Next
						</Link>
					</div>
				</div>
			)}
		</div>
	);
};

export default CasesGrid;
