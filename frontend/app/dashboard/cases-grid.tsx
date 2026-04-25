'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Case
{
	id: string;
	name: string;
	year: number;
	category: string;
	summary: string;
	citation: string;
}

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

		return `${pathname}${params.toString() ? `?${searchParams.toString()}` : ""}`;
	}, [pathname, searchParams]);

	// Advanced filters state
	const [issue, setIssue] = useState<string>(searchParams.get("category") ?? "");
	const [searchQuery, setSearchQuery] = useState<string>(searchParams.get("q") ?? "");
	const [yearFrom, setYearFrom] = useState<string>(searchParams.get("year_from") ?? "");
	const [yearTo, setYearTo] = useState<string>(searchParams.get("year_to") ?? "");
	const [keyword, setKeyword] = useState<string>(searchParams.get("keyword") ?? "");

	const [issuesList, setIssuesList] = useState<string[]>([]);

	const [externalResults, setExternalResults] = useState<ExternalCase[]>([]);
	const [externalPage, setExternalPage] = useState<number>(1);
	const [externalLoading, setExternalLoading] = useState<boolean>(false);

	const [popularCases, setPopularCases] = useState<Case[]>([]);
	
	// Load more state
	const [displayedCases, setDisplayedCases] = useState<Case[]>(initialCases);
	const [loadMoreLoading, setLoadMoreLoading] = useState(false);
	const [hasMoreResults, setHasMoreResults] = useState(initialCases.length === 5);

	// Animation visibility: only show if no search inputs AND no results (initial or external)
	const isSearching = Boolean(searchQuery || issue || yearFrom || yearTo || keyword);
	const showPopular = !isSearching && displayedCases.length === 0 && externalResults.length === 0;

	// Reset displayed cases when initialCases change (e.g. on new search)
	useEffect(() => {
		setDisplayedCases(initialCases);
		setHasMoreResults(initialCases.length === 5);
	}, [initialCases]);

	useEffect(() =>
	{
		const trimmedQuery = searchQuery.trim();
		const nextHref = buildHref(trimmedQuery, 1);
		const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

		if(nextHref === currentHref) return;

		const timeout = window.setTimeout(() =>
		{
			router.replace(nextHref);
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [buildHref, pathname, router, searchQuery, searchParams]);

	const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
	const endIndex = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);

	const applyAdvancedFilters = () =>
	{
		const params = new URLSearchParams(searchParams.toString());

		if(issue) params.set("category", issue);
		else params.delete("category");

		if(searchQuery) params.set("q", searchQuery);
		else params.delete("q");

		if(yearFrom) params.set("year_from", yearFrom);
		else params.delete("year_from");

		if(yearTo) params.set("year_to", yearTo);
		else params.delete("year_to");

		if(keyword) params.set("keyword", keyword);
		else params.delete("keyword");

		router.replace(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
	};

	const fetchExternal = async (pageNum = 1) =>
	{
		if(!searchQuery && !keyword) return;
		setExternalLoading(true);
		try {
			const q = searchQuery || keyword;
			const res = await fetch(`${API_URL}/external-cases?q=${encodeURIComponent(q)}&page=${pageNum}&limit=5`);
			if(!res.ok) throw new Error();
			const data = await res.json();
			if(pageNum === 1) setExternalResults(data.results || []);
			else setExternalResults(prev => [...prev, ...(data.results || [])]);
			setExternalPage(pageNum);
		} catch {
			// ignore
		} finally {
			setExternalLoading(false);
		}
	};

	const loadMoreCases = async () => {
		setLoadMoreLoading(true);
		try {
			const currentIds = displayedCases.map(c => c.id).join(",");
			const url = new URL(`${API_URL}/cases`);
			if (searchQuery) url.searchParams.set("q", searchQuery);
			if (issue) url.searchParams.set("category", issue);
			if (yearFrom) url.searchParams.set("year_from", yearFrom);
			if (yearTo) url.searchParams.set("year_to", yearTo);
			if (keyword) url.searchParams.set("keyword", keyword);
			url.searchParams.set("exclude", currentIds);
			url.searchParams.set("limit", "5");

			const res = await fetch(url.toString());
			if (!res.ok) throw new Error();
			const data = await res.json();
			if (data.cases && data.cases.length > 0) {
				setDisplayedCases(prev => [...prev, ...data.cases]);
				setHasMoreResults(data.cases.length === 5);
			} else {
				setHasMoreResults(false);
			}
		} catch {
			setHasMoreResults(false);
		} finally {
			setLoadMoreLoading(false);
		}
	};

	const resetFilters = () => {
		setSearchQuery("");
		setIssue("");
		setYearFrom("");
		setYearTo("");
		setKeyword("");
		setExternalResults([]);
		setDisplayedCases([]);
		router.replace(pathname);
	};

	// load static issues once
	useEffect(() => { 
		const loadIssues = async () =>
		{
			try {
				const res = await fetch(`${API_URL}/cases/issues`);
				if(!res.ok) return;
				const data = await res.json();
				setIssuesList(data.issues || []);
			} catch {}
		};
		loadIssues(); 
	}, []);

	// load popular cases when there is no active search/filters
	useEffect(() => {
		const loadPopular = async () => {
			if(!showPopular) return;
			try {
				const url = `${API_URL}/cases/popular?limit=5`;
				const res = await fetch(url);
				if(!res.ok) throw new Error();
				const data = await res.json();
				if (data.cases) setPopularCases(data.cases);
			} catch (err) {
				setPopularCases([]);
			}
		};

		loadPopular();
	}, [showPopular]);


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
										<select value={issue} onChange={e => setIssue(e.target.value)} className="border border-border rounded-md px-2 py-1 h-10 bg-background">
											<option value="">All issues</option>
											{issuesList.map(i => <option key={i} value={i}>{i}</option>)}
										</select>
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

				<Link href="/dashboard/cases/custom">
					<Button className="font-semibold h-10">
						+ Build your own case
					</Button>
				</Link>
			</div>

			{/* show message only when a user performed a search/filters but there are no local or external results */}
			{( isSearching && displayedCases.length === 0 && externalResults.length === 0) && (
				<p className="text-sm text-muted-foreground">No cases match your search.</p>
			)}

			{externalResults.length > 0 && (
				<div className="flex flex-col gap-3">
					<p className="text-sm font-medium">Supreme Court matches</p>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{externalResults.map((r, i) => (
										<Card key={`${r.citation.case_name}-${i}`} className="h-full flex flex-col" >
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

			{/* Local (Gemini) search results */}
			{displayedCases.length > 0 && (
				<div className="flex flex-col gap-6">
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{displayedCases.map((c) => (
							<Link
								key={c.id}
								href={`/dashboard/cases/${c.id}`}
								className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
							>
								<Card className="h-full flex flex-col hover:bg-muted transition-colors cursor-pointer">
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
									</CardFooter>
								</Card>
							</Link>
						))}
					</div>
					{hasMoreResults && (
						<div className="flex justify-center mt-4">
							<Button 
								variant="outline" 
								onClick={loadMoreCases} 
								disabled={loadMoreLoading}
								className="w-full max-w-xs"
							>
								{loadMoreLoading ? "Generating..." : "Generate another row of 5"}
							</Button>
						</div>
					)}
				</div>
			)}

			{totalCount > 0 && displayedCases.length === initialCases.length && (
				<p className="text-xs text-muted-foreground">
					Showing {startIndex}-{endIndex} of {totalCount} cases
				</p>
			)}

			{showPopular && (
				<div className="relative w-full h-[450px] mt-4 mb-10 overflow-hidden">
					{popularCases.map((c, i) => (
						<Link
							key={c.id}
							href={`/dashboard/cases/${c.id}`}
							className="absolute left-1/2 top-0 -translate-x-1/2 w-72 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl animate-arc-x"
							style={{ 
								animationDelay: `-${i * (27000 / popularCases.length)}ms`,
								zIndex: 0
							}}
						>
							<div 
								className="animate-arc-y"
								style={{ 
									animationDelay: `-${i * (27000 / popularCases.length)}ms`,
									willChange: 'transform, opacity'
								}}
							>
								<Card className="h-full flex flex-col hover:bg-muted transition-colors cursor-pointer shadow-xl border-primary/10">
									<CardHeader className="pb-2 p-4">
										<div className="flex items-center justify-between mb-1">
											<Badge variant="secondary" className="text-[10px] h-4 px-1">{c.category}</Badge>
											<span className="text-[10px] text-muted-foreground">{c.year}</span>
										</div>
										<CardTitle className="text-sm font-bold leading-tight line-clamp-1">{c.name}</CardTitle>
									</CardHeader>
									<CardContent className="flex-1 p-4 pt-0">
										<p className="text-xs text-muted-foreground line-clamp-3">{c.summary}</p>
									</CardContent>
									<CardFooter className="p-4 pt-0">
										<span className="text-[10px] text-muted-foreground truncate">{c.citation}</span>
									</CardFooter>
								</Card>
							</div>
						</Link>
					))}
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
