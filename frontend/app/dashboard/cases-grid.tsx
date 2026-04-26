'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Case } from "@/types/case";
import { API_URL } from "@/lib/api";
import Carousel from "./carousel";
import Link from "next/link";

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
}

export default function CasesGrid({ cases: initialCases, page, totalCount, totalPages, pageSize }: Props)
{
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const buildHref = useCallback((nextQuery: string, nextPage: number) =>
	{
		const params = new URLSearchParams(searchParams.toString());

		if(nextQuery) params.set("q", nextQuery);
		else params.delete("q");

		if(nextPage > 1) params.set("page", String(nextPage));
		else params.delete("page");

		return `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
	}, [pathname, searchParams]);

	const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("q") ?? "");
	const [yearFrom, setYearFrom] = useState<string>(searchParams.get("year_from") ?? "");
	const [yearTo, setYearTo] = useState<string>(searchParams.get("year_to") ?? "");
	const [keyword, setKeyword] = useState<string>(searchParams.get("keyword") ?? "");

	const [externalResults, setExternalResults] = useState<ExternalCase[]>([]);
	const [externalPage, setExternalPage] = useState<number>(1);
	const [externalLoading, setExternalLoading] = useState<boolean>(false);

	const [popularCases, setPopularCases] = useState<Case[]>([]);
	const [popularLoading, setPopularLoading] = useState<boolean>(false);

	const [displayedCases, setDisplayedCases] = useState<Case[]>(initialCases);
	const [searchLoading, setSearchLoading] = useState(false);

	const isSearching = Boolean(searchQuery || yearFrom || yearTo || keyword);
	const showPopular = !isSearching && displayedCases.length === 0 && externalResults.length === 0;

	useEffect(() => {
		Promise.resolve().then(() => {
			setDisplayedCases(initialCases);
			setSearchLoading(false);
		});
	}, [initialCases]);

	useEffect(() =>
	{
		const trimmedQuery = searchQuery.trim();
		const nextHref = buildHref(trimmedQuery, 1);
		const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

		if(nextHref === currentHref) return;

		const timeout = window.setTimeout(() =>
		{
			setSearchLoading(true);
			router.replace(nextHref);
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [buildHref, pathname, router, searchQuery, searchParams]);

	useEffect(() => {
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

	const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
	const endIndex = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

	function applyAdvancedFilters()
	{
		const params = new URLSearchParams(searchParams.toString());

		if(searchQuery) params.set("q", searchQuery);
		else params.delete("q");

		if(yearFrom) params.set("year_from", yearFrom);
		else params.delete("year_from");

		if(yearTo) params.set("year_to", yearTo);
		else params.delete("year_to");

		if(keyword) params.set("keyword", keyword);
		else params.delete("keyword");

		router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
	}

	async function fetchExternal(pageNum = 1)
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
	}

	function resetFilters()
	{
		setSearchQuery("");
		setYearFrom("");
		setYearTo("");
		setKeyword("");
		setExternalResults([]);
		setDisplayedCases([]);
		router.replace(pathname);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
				<div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-1 w-full lg:w-auto">
					<Input
						type="search"
						name="q"
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						placeholder="Search case name or topic..."
						className="max-w-sm"
					/>
					<div className="flex items-center gap-2">
						{(isSearching || page > 1 || displayedCases.length > initialCases.length) && (
							<button
								type="button"
								onClick={resetFilters}
								className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors h-10"
							>
								Reset
							</button>
						)}
						<Accordion type="single" collapsible className="w-full sm:w-auto">
							<AccordionItem value="advanced" className="border-none">
								<AccordionTrigger className="hover:no-underline py-0 h-10 px-4 border rounded-md">
									Advanced
								</AccordionTrigger>
								<AccordionContent className="pt-4">
									<div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
										<Input placeholder="Keywords (comma separated)" value={keyword} onChange={e => setKeyword(e.target.value)} className="h-10" />
										<Input placeholder="Year from" type="number" value={yearFrom} onChange={e => setYearFrom(e.target.value)} className="h-10" />
										<Input placeholder="Year to" type="number" value={yearTo} onChange={e => setYearTo(e.target.value)} className="h-10" />
									</div>
									<div className="flex items-center gap-2 pt-2">
										<Button size="sm" onClick={applyAdvancedFilters}>Apply Filters</Button>
										<Button variant="ghost" size="sm" onClick={() => fetchExternal(1)}>
											Search Supreme Court
										</Button>
									</div>
								</AccordionContent>
							</AccordionItem>
						</Accordion>
					</div>
				</div>

				<Link href="/cases/custom">
					<Button className="font-semibold h-10">
						+ Build your own case
					</Button>
				</Link>
			</div>

			{isSearching && searchLoading && (
				<div className="flex gap-4 px-6 py-2">
					{Array.from({ length: 3 }).map((_, i) => (
						<div key={i} className="flex-none w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-10.666px)]">
							<div className="min-h-[220px] rounded-xl border border-border bg-card flex flex-col p-4 gap-3 animate-pulse">
								<div className="flex items-center justify-between">
									<div className="h-4 w-20 bg-muted rounded-full" />
									<div className="h-3 w-8 bg-muted rounded" />
								</div>
								<div className="h-5 w-3/4 bg-muted rounded" />
								<div className="h-4 w-full bg-muted rounded" />
								<div className="h-4 w-full bg-muted rounded" />
								<div className="h-4 w-5/6 bg-muted rounded" />
								<div className="mt-auto h-3 w-28 bg-muted rounded" />
							</div>
						</div>
					))}
				</div>
			)}

			{isSearching && !searchLoading && displayedCases.length === 0 && externalResults.length === 0 && (
				<p className="text-sm text-muted-foreground">No cases match your search.</p>
			)}

			{externalResults.length > 0 && (
				<div className="flex flex-col gap-3">
					<p className="text-sm font-medium">Supreme Court matches</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{externalResults.map((r, i) => (
							<Card key={`${r.citation.case_name}-${i}`} className="h-full flex flex-col">
								<CardHeader className="pb-2">
									<div className="flex items-center justify-between mb-1">
										<Badge variant="secondary">{r.citation.court ?? "SCOTUS"}</Badge>
										<span className="text-xs text-muted-foreground">{r.citation.year}</span>
									</div>
									<CardTitle className="text-base leading-snug">{r.citation.case_name}</CardTitle>
								</CardHeader>
								<CardContent className="flex-1">
									<p className="text-sm text-muted-foreground">{r.relevant_quote || r.relevance_explanation}</p>
								</CardContent>
								<CardFooter>
									{r.citation.citation && <span className="text-xs text-muted-foreground">{r.citation.citation}</span>}
									{r.citation.url && (
										<a href={r.citation.url} target="_blank" rel="noreferrer" className="ml-2 text-xs text-primary hover:underline">View</a>
									)}
								</CardFooter>
							</Card>
						))}
					</div>
					<div className="flex items-center gap-2 pt-2">
						<Button size="sm" variant="outline" onClick={() => fetchExternal(externalPage + 1)} disabled={externalLoading}>
							{externalLoading ? "Loading..." : "More results"}
						</Button>
					</div>
				</div>
			)}

			{displayedCases.length > 0 && (
				<div className="flex flex-col gap-6 relative">
					<div className="flex items-center justify-between mb-2">
						<div />
						<div className="text-sm text-muted-foreground">Cases</div>
						<div />
					</div>

					<Carousel
						cases={displayedCases}
						renderCard={c => (
							<Link
								href={`/cases/${c.id}`}
								className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl block h-full"
							>
								<Card className="h-full flex flex-col hover:bg-muted transition-colors cursor-pointer min-h-[220px]">
									<CardHeader className="pb-2">
										<div className="flex items-center justify-between mb-1">
											<Badge variant="secondary">{c.category}</Badge>
											<span className="text-xs text-muted-foreground">{c.year}</span>
										</div>
										<CardTitle className="text-base leading-snug">{c.name}</CardTitle>
									</CardHeader>
									<CardContent className="flex-1">
										<p className="text-sm text-muted-foreground line-clamp-4">{c.summary}</p>
									</CardContent>
									<CardFooter>
										<span className="text-xs text-muted-foreground">{c.citation}</span>
										{c.court_listener_link && (
											<button onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(c.court_listener_link!, '_blank', 'noopener,noreferrer'); }} className="ml-2 text-xs text-primary hover:underline cursor-pointer">CourtListener →</button>
										)}
									</CardFooter>
								</Card>
							</Link>
						)}
					/>
				</div>
			)}

			{totalCount > 0 && displayedCases.length === initialCases.length && (
				<p className="text-xs text-muted-foreground">
					Showing {startIndex}-{endIndex} of {totalCount} cases
				</p>
			)}

			{showPopular && popularLoading && (
				<div className="w-full mt-4 mb-10">
					<div className="flex items-center justify-between mb-2">
						<div />
						<div className="h-4 w-24 bg-muted rounded animate-pulse" />
						<div />
					</div>
					<div className="flex gap-4 px-6 py-2">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="flex-none w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-10.666px)]">
								<div className="h-[380px] rounded-xl border border-border bg-card flex flex-col p-6 gap-3 animate-pulse">
									<div className="flex items-center justify-between">
										<div className="h-4 w-20 bg-muted rounded-full" />
										<div className="h-3 w-8 bg-muted rounded" />
									</div>
									<div className="h-6 w-3/4 bg-muted rounded" />
									<div className="h-4 w-full bg-muted rounded" />
									<div className="h-4 w-full bg-muted rounded" />
									<div className="h-4 w-5/6 bg-muted rounded" />
									<div className="h-4 w-full bg-muted rounded" />
									<div className="mt-auto h-3 w-28 bg-muted rounded" />
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{showPopular && !popularLoading && (
				<div className="w-full h-auto mt-4 mb-10">
					<div className="flex items-center justify-between mb-2">
						<div />
						<div className="text-sm text-muted-foreground">Popular cases</div>
						<div />
					</div>

					<Carousel
						cases={popularCases}
						renderCard={pc => (
							<Link
								href={`/cases/${pc.id}`}
								className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl block h-full"
							>
								<Card className="h-[380px] flex flex-col hover:bg-muted transition-colors cursor-pointer shadow-xl border-primary/10">
									<CardHeader className="pb-2 p-6">
										<div className="flex items-center justify-between mb-1">
											<Badge variant="secondary" className="text-[10px] h-4 px-1">{pc.category}</Badge>
											<span className="text-[10px] text-muted-foreground">{pc.year}</span>
										</div>
										<CardTitle className="text-lg font-bold leading-tight line-clamp-2">{pc.name}</CardTitle>
									</CardHeader>
									<CardContent className="flex-1 p-6 pt-0">
										<p className="text-sm text-muted-foreground line-clamp-4">{pc.summary}</p>
									</CardContent>
									<CardFooter className="p-4 pt-0">
										<span className="text-[12px] text-muted-foreground truncate">{pc.citation}</span>
										{pc.court_listener_link && (
											<button onClick={e => { e.preventDefault(); e.stopPropagation(); window.open(pc.court_listener_link!, '_blank', 'noopener,noreferrer'); }} className="ml-2 text-xs text-primary hover:underline cursor-pointer">CourtListener →</button>
										)}
									</CardFooter>
								</Card>
							</Link>
						)}
					/>
				</div>
			)}

			{totalPages > 1 && displayedCases.length === initialCases.length && (
				<div className="flex items-center justify-between gap-3 pt-2">
					<p className="text-xs text-muted-foreground">
						Page {page} of {totalPages}
					</p>
					<div className="flex items-center gap-2">
						<Link
							href={buildHref(searchQuery, Math.max(1, page - 1))}
							aria-disabled={page <= 1}
							className={`inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"}`}
						>
							Previous
						</Link>
						<Link
							href={buildHref(searchQuery, Math.min(totalPages, page + 1))}
							aria-disabled={page >= totalPages}
							className={`inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-muted"}`}
						>
							Next
						</Link>
					</div>
				</div>
			)}
		</div>
	);
}
