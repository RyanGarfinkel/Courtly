'use client';

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface DiscoveredCase
{
	id: string;
	name: string;
	year: number;
	category: string;
	summary: string;
	citation: string;
	source: "courtlistener";
}

interface Case
{
	id: string;
	name: string;
	year: number;
	category: string;
	summary: string;
	citation: string;
}

interface Props
{
	cases: Case[];
	query: string;
	page: number;
	totalCount: number;
	totalPages: number;
	pageSize: number;
}

export default function CasesGrid({ cases, query, page, totalCount, totalPages, pageSize }: Props)
{
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [search, setSearch] = useState(query);
	const [discoveredCases, setDiscoveredCases] = useState<DiscoveredCase[]>([]);
	const [discovering, setDiscovering] = useState(false);
	const [creatingId, setCreatingId] = useState<string | null>(null);

	const buildHref = useCallback((nextQuery: string, nextPage: number) =>
	{
		const params = new URLSearchParams(searchParams.toString());

		if(nextQuery) params.set("q", nextQuery);
		else params.delete("q");

		if(nextPage > 1) params.set("page", String(nextPage));
		else params.delete("page");

		return `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
	}, [pathname, searchParams]);

	useEffect(() =>
	{
		const trimmedQuery = search.trim();
		const nextHref = buildHref(trimmedQuery, 1);
		const currentHref = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

		if(nextHref === currentHref) return;

		const timeout = window.setTimeout(() =>
		{
			router.replace(nextHref);
		}, 300);

		return () => window.clearTimeout(timeout);
	}, [buildHref, pathname, router, search, searchParams]);

	useEffect(() =>
	{
		const trimmed = search.trim();
		if(trimmed.length < 2)
		{
			setDiscoveredCases([]);
			return;
		}

		setDiscovering(true);
		const timeout = window.setTimeout(async () =>
		{
			try
			{
				const res = await fetch(`${API_URL}/cases/discover?q=${encodeURIComponent(trimmed)}`);
				if(res.ok) setDiscoveredCases(await res.json());
			}
			catch { /* ignore */ }
			finally { setDiscovering(false); }
		}, 500);

		return () => window.clearTimeout(timeout);
	}, [search]);

	async function handleDiscoveredClick(dc: DiscoveredCase)
	{
		setCreatingId(dc.id);
		try
		{
			const res = await fetch(`${API_URL}/cases`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: dc.name,
					summary: dc.summary,
					citation: dc.citation,
					year: dc.year,
					category: dc.category,
				}),
			});
			if(!res.ok) throw new Error();
			const newCase = await res.json();
			router.push(`/dashboard/cases/${newCase.id}`);
		}
		catch { setCreatingId(null); }
	}

	const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
	const endIndex = totalCount === 0 ? 0 : Math.min(page * pageSize, totalCount);


	return (
		<div className="flex flex-col gap-6">
			<div className="flex flex-col sm:flex-row gap-3 sm:items-center">
				<Input
					type="search"
					name="q"
					value={search}
					onChange={e => setSearch(e.target.value)}
					placeholder="Search cases..."
					className="max-w-sm"
				/>
				<div className="flex items-center gap-2">
					{(query || page > 1) && (
						<button
							type="button"
							onClick={() =>
							{
								setSearch("");
								router.replace(pathname);
							}}
							className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
						>
							Reset
						</button>
					)}
				</div>
				</div>

			{cases.length === 0 && (
				<p className="text-sm text-muted-foreground">No cases match your search.</p>
			)}

			{totalCount > 0 && (
				<p className="text-xs text-muted-foreground">
					Showing {startIndex}-{endIndex} of {totalCount} cases
				</p>
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<Link
					href="/dashboard/cases/custom"
					className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl"
				>
					<Card className="h-full border-dashed hover:bg-muted transition-colors cursor-pointer">
						<CardContent className="flex flex-col items-center justify-center h-full min-h-48 gap-2 text-center">
							<span className="text-2xl text-muted-foreground">+</span>
							<p className="font-semibold">Build your own case</p>
							<p className="text-sm text-muted-foreground">Define a custom scenario and bring it before the Court.</p>
						</CardContent>
					</Card>
				</Link>

				{cases.map(c => (
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
								<p className="text-sm text-muted-foreground">{c.summary}</p>
							</CardContent>
							<CardFooter>
								<span className="text-xs text-muted-foreground">{c.citation}</span>
							</CardFooter>
						</Card>
					</Link>
				))}
			</div>

			{totalPages > 1 && (
				<div className="flex items-center justify-between gap-3 pt-2">
					<p className="text-xs text-muted-foreground">
						Page {page} of {totalPages}
					</p>
					<div className="flex items-center gap-2">
						<Link
							href={buildHref(query, Math.max(1, page - 1))}
							aria-disabled={page <= 1}
							className={`inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-muted"}`}
						>
							Previous
						</Link>
						<Link
							href={buildHref(query, Math.min(totalPages, page + 1))}
							aria-disabled={page >= totalPages}
							className={`inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${page >= totalPages ? "pointer-events-none opacity-40" : "hover:bg-muted"}`}
						>
							Next
						</Link>
					</div>
				</div>
			)}

			{(discoveredCases.length > 0 || discovering) && (
				<div className="flex flex-col gap-4 pt-4 border-t border-border">
					<div className="flex items-center gap-2">
						<p className="text-sm font-medium">From CourtListener</p>
						{discovering && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
						{discoveredCases.map(dc => (
							<button
								key={dc.id}
								type="button"
								disabled={creatingId === dc.id}
								onClick={() => handleDiscoveredClick(dc)}
								className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl disabled:opacity-60"
							>
								<Card className="h-full flex flex-col hover:bg-muted transition-colors cursor-pointer">
									<CardHeader className="pb-2">
										<div className="flex items-center justify-between mb-1">
											<Badge variant="outline">{dc.category}</Badge>
											<span className="text-xs text-muted-foreground">{dc.year || ""}</span>
										</div>
										<CardTitle className="text-base leading-snug">
											{creatingId === dc.id
												? <span className="flex items-center gap-2"><Loader2 className="h-3 w-3 animate-spin" />Adding case...</span>
												: dc.name
											}
										</CardTitle>
									</CardHeader>
									<CardContent className="flex-1">
										<p className="text-sm text-muted-foreground line-clamp-3">{dc.summary}</p>
									</CardContent>
									<CardFooter>
										<span className="text-xs text-muted-foreground">{dc.citation}</span>
									</CardFooter>
								</Card>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}
