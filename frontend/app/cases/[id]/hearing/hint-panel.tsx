'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AssistantPanel from './assistant-panel';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StressTestResult
{
	scores: {
		relevance: number;
		legal_strength: number;
		consistency: number;
		clarity: number;
	};
	weaknesses: string[];
	suggestions: string[];
}

interface Props
{
	open: boolean;
	onClose: () => void;
	hearingId: string;
	pendingQuestion: { id: string; speaker: string; content: string } | null;
	draft: string;
	phase: string;
	defaultTab?: Tab;
}

export type Tab = 'hints' | 'clerk' | 'stress';

const SCORE_LABELS: Record<string, string> = {
	relevance: 'Relevance',
	legal_strength: 'Legal Strength',
	consistency: 'Consistency',
	clarity: 'Clarity',
};

function scoreColor(score: number)
{
	if(score >= 80) return 'bg-foreground/70';
	if(score >= 60) return 'bg-foreground/40';
	return 'bg-muted-foreground/40';
}

export default function HintPanel({ open, onClose, hearingId, pendingQuestion, draft, phase, defaultTab }: Props)
{
	const [tab, setTab] = useState<Tab>(defaultTab ?? 'hints');
	const defaultTabRef = useRef(defaultTab);
	defaultTabRef.current = defaultTab;

	useEffect(() =>
	{
		if(open) setTab(defaultTabRef.current ?? 'hints');
	}, [open]);
	const [hints, setHints] = useState<string[] | null>(null);
	const [hintsLoading, setHintsLoading] = useState(false);
	const [hintsError, setHintsError] = useState<string | null>(null);
	const [hintsHearingId, setHintsHearingId] = useState<string | null>(null);

	const [stressResult, setStressResult] = useState<StressTestResult | null>(null);
	const [stressLoading, setStressLoading] = useState(false);
	const [stressError, setStressError] = useState<string | null>(null);

	const fetchHints = useCallback(async () =>
	{
		if(hintsLoading) return;
		setHintsLoading(true);
		setHintsError(null);
		try
		{
			const res = await fetch(`${API_URL}/hearing/hint`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ hearing_id: hearingId }),
			});
			if(!res.ok)
			{
				setHintsError('Could not load hints. Please try again.');
				return;
			}
			const data = await res.json();
			setHints(data.hints);
			setHintsHearingId(hearingId);
		}
		finally
		{
			setHintsLoading(false);
		}
	}, [hearingId, hintsLoading]);

	useEffect(() =>
	{
		if(open && tab === 'hints' && hints === null && hintsHearingId !== hearingId)
			fetchHints();
	}, [open, tab, hints, hearingId, hintsHearingId, fetchHints]);

	async function handleStressTest()
	{
		if(!draft.trim() || stressLoading) return;
		setStressLoading(true);
		setStressResult(null);
		setStressError(null);
		try
		{
			const res = await fetch(`${API_URL}/hearing/stress-test`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					hearing_id: hearingId,
					question: pendingQuestion?.content ?? '',
					draft: draft.trim(),
				}),
			});
			if(!res.ok)
			{
				setStressError('Session expired. Please re-submit your brief.');
				return;
			}
			setStressResult(await res.json());
		}
		finally
		{
			setStressLoading(false);
		}
	}

	const TABS: { id: Tab; label: string }[] = [
		{ id: 'hints', label: 'Hints' },
		{ id: 'clerk', label: 'Clerk' },
		{ id: 'stress', label: 'Stress Test' },
	];

	return (
		<div className="flex flex-col h-full w-full bg-background">
				<div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
					<span className="text-sm font-semibold">Assistance</span>
					<button
						onClick={onClose}
						className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
						aria-label="Close panel"
					>
						<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
							<path d="M1 1l12 12M13 1L1 13" />
						</svg>
					</button>
				</div>

				<div className="flex gap-0 border-b border-border shrink-0 px-5">
					{TABS.map(t => (
						<button
							key={t.id}
							onClick={() => setTab(t.id)}
							className={cn(
								'px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px',
								tab === t.id
									? 'border-foreground text-foreground'
									: 'border-transparent text-muted-foreground hover:text-foreground/70',
							)}
						>
							{t.label}
						</button>
					))}
				</div>

				<div className="flex-1 overflow-y-auto p-5">
					{tab === 'hints' && (
						<div className="flex flex-col gap-4">
							{hintsLoading && (
								<div className="flex flex-col gap-3">
									<Skeleton className="h-3 w-3/4" />
									<Skeleton className="h-3 w-full" />
									<Skeleton className="h-3 w-5/6" />
									<Skeleton className="h-3 w-2/3" />
									<Skeleton className="h-3 w-4/5" />
								</div>
							)}

							{hintsError && (
								<div className="flex flex-col gap-3">
									<p className="text-xs text-destructive">{hintsError}</p>
									<button
										onClick={fetchHints}
										className="text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
									>
										Try again
									</button>
								</div>
							)}

							{hints && !hintsLoading && (
								<div className="flex flex-col gap-2">
									<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Suggested Angles</p>
									<div className="flex flex-col gap-3">
										{hints.map((hint, i) => (
											<div key={i} className="flex gap-3 text-xs text-foreground leading-relaxed pl-3 border-l-2 border-primary/40">
												<p>{hint}</p>
											</div>
										))}
									</div>
								</div>
							)}

							{!hints && !hintsLoading && !hintsError && (
								<p className="text-xs text-muted-foreground text-center py-4">Loading hints…</p>
							)}
						</div>
					)}

					{tab === 'clerk' && (
						<AssistantPanel hearingId={hearingId} pendingQuestion={pendingQuestion} />
					)}

					{tab === 'stress' && (
						<div className="flex flex-col gap-4">
							{draft.trim()
								? (
									<div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
										<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-2">Current Draft</p>
										<p className="text-xs text-foreground leading-relaxed line-clamp-4">{draft}</p>
									</div>
								)
								: (
									<p className="text-xs text-muted-foreground italic">No draft yet — write something in the response area first.</p>
								)
							}

							<button
								onClick={handleStressTest}
								disabled={!draft.trim() || stressLoading}
								className={cn(
									'w-full px-4 py-2.5 rounded-md border text-xs font-medium transition-colors',
									'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40',
									'disabled:opacity-40 disabled:cursor-not-allowed',
									'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground',
								)}
							>
								{stressLoading ? 'Analyzing…' : 'Run Stress Test →'}
							</button>

							{stressError && (
								<p className="text-xs text-destructive">{stressError}</p>
							)}

							{stressLoading && (
								<div className="flex flex-col gap-2.5">
									<Skeleton className="h-3 w-full" />
									<Skeleton className="h-3 w-5/6" />
									<Skeleton className="h-3 w-3/4" />
									<Skeleton className="h-3 w-full" />
								</div>
							)}

							{stressResult && !stressLoading && (
								<div className="flex flex-col gap-5">
									<div className="flex flex-col gap-2">
										<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Scores</p>
										<div className="flex flex-col gap-2.5">
											{stressResult.scores && (Object.entries(stressResult.scores) as [string, number][]).map(([key, score]) => (
												<div key={key} className="flex flex-col gap-1">
													<div className="flex justify-between text-xs">
														<span className="text-muted-foreground">{SCORE_LABELS[key] ?? key}</span>
														<span className="font-medium tabular-nums">{score}</span>
													</div>
													<div className="h-1.5 bg-muted rounded-full overflow-hidden">
														<div
															className={cn('h-full rounded-full transition-all duration-700', scoreColor(score))}
															style={{ width: `${score}%` }}
														/>
													</div>
												</div>
											))}
										</div>
									</div>

									{stressResult.weaknesses?.length > 0 && (
										<div className="flex flex-col gap-2">
											<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Weaknesses</p>
											{stressResult.weaknesses.map((w, i) => (
												<p key={i} className="text-xs text-foreground leading-relaxed pl-3 border-l-2 border-border">
													{w}
												</p>
											))}
										</div>
									)}

									{stressResult.suggestions?.length > 0 && (
										<div className="flex flex-col gap-2">
											<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Suggestions</p>
											{stressResult.suggestions.map((s, i) => (
												<p key={i} className="text-xs text-foreground leading-relaxed pl-3 border-l-2 border-border/40">
													{s}
												</p>
											))}
										</div>
									)}
								</div>
							)}
						</div>
					)}
				</div>
		</div>
	);
}
