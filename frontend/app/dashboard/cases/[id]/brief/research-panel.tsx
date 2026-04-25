'use client';

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Citation
{
	case_name: string;
	citation: string | null;
	court: string | null;
	year: number | null;
	url: string | null;
}

interface LegalSource
{
	citation: Citation;
	relevant_quote: string;
	relevance_explanation: string;
}

interface Props
{
	caseId: string;
	caseName: string;
}

export default function ResearchPanel({ caseId, caseName }: Props)
{
	const [sources, setSources] = useState<LegalSource[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(false);

	const loadResearch = useCallback(async () =>
	{
		setLoading(true);
		setError(false);
		try
		{
			const res = await fetch(`${API_URL}/research?case_id=${encodeURIComponent(caseId)}&q=${encodeURIComponent(caseName)}`);
			if(!res.ok) throw new Error();
			setSources(await res.json());
		}
		catch
		{
			setError(true);
		}
		finally
		{
			setLoading(false);
		}
	}, [caseId, caseName]);

	useEffect(() =>
	{
		const run = async () => {
			await loadResearch();
		};
		run();
	}, [loadResearch]);

	if(loading)
	{
		return (
			<div className="flex flex-col gap-3 pt-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<div key={i} className="flex flex-col gap-2 p-3 border border-border rounded-lg">
						<Skeleton className="h-4 w-3/4" />
						<Skeleton className="h-3 w-1/2" />
					</div>
				))}
			</div>
		);
	}

	if(error)
	{
		return (
			<div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
				<p className="text-sm text-muted-foreground">Failed to load research.</p>
				<Button variant="outline" size="sm" onClick={loadResearch}>Try again</Button>
			</div>
		);
	}

	if(sources.length === 0)
	{
		return (
			<div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
				<p className="text-sm text-muted-foreground">No citations found for this case.</p>
				<Button variant="outline" size="sm" onClick={loadResearch}>Try again</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center justify-between mb-1">
				<p className="text-xs text-muted-foreground">{sources.length} sources found</p>
				<Button variant="ghost" size="sm" onClick={loadResearch}>Refresh</Button>
			</div>

			<Accordion type="single" collapsible className="flex flex-col gap-2">
				{sources.map((s, i) => (
					<AccordionItem key={i} value={`source-${i}`} className="border border-border rounded-lg px-3">
						<AccordionTrigger className="hover:no-underline py-3">
							<div className="flex flex-col items-start gap-0.5 text-left">
								<span className="text-sm font-medium leading-snug">{s.citation.case_name}</span>
								<span className="text-xs text-muted-foreground">
									{[s.citation.court, s.citation.year, s.citation.citation].filter(Boolean).join(" · ")}
								</span>
							</div>
						</AccordionTrigger>
						<AccordionContent className="flex flex-col gap-3 pb-4">
							<div className="border-l-2 border-border pl-3">
								<p className="text-xs italic text-muted-foreground leading-relaxed">&quot;{s.relevant_quote}&quot;</p>
							</div>
							<div>
								<p className="text-xs font-medium mb-1">Why it matters</p>
								<p className="text-xs text-muted-foreground leading-relaxed">{s.relevance_explanation}</p>
							</div>
							{s.citation.url && (
								<a
									href={s.citation.url}
									target="_blank"
									rel="noopener noreferrer"
									className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring self-start"
								>
									View full opinion →
								</a>
							)}
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</div>
	);
}
