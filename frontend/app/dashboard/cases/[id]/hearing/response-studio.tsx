'use client';

import { useEffect, useCallback, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

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

interface ArgumentMapData
{
	claims: { id: string; text: string; strength: number }[];
	counters: { id: string; text: string; attacks: string[]; severity: 'high' | 'medium' | 'low' }[];
}

interface Props
{
	hearingId: string;
	pendingQuestion: { speaker: string; content: string } | null;
	phase: string;
	onSubmit: (response: string) => void;
	loading: boolean;
	onMapGenerated: (data: ArgumentMapData) => void;
}

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

export default function ResponseStudio({ hearingId, pendingQuestion, phase, onSubmit, loading, onMapGenerated }: Props)
{
	const [draft, setDraft] = useState('');
	const [analysis, setAnalysis] = useState<StressTestResult | null>(null);
	const [analyzing, setAnalyzing] = useState(false);
	const [mapping, setMapping] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function handleStressTest()
	{
		if(!draft.trim() || analyzing) return;
		setAnalyzing(true);
		setAnalysis(null);
		setError(null);
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
				setError('Session expired. Please re-submit your brief.');
				return;
			}
			setAnalysis(await res.json());
		}
		finally
		{
			setAnalyzing(false);
		}
	}

	async function handleMap()
	{
		if(!draft.trim() || mapping) return;
		setMapping(true);
		setError(null);
		try
		{
			const res = await fetch(`${API_URL}/hearing/argument-map`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					hearing_id: hearingId,
					draft: draft.trim(),
					question: pendingQuestion?.content ?? '',
				}),
			});
			if(!res.ok)
			{
				setError('Session expired. Please re-submit your brief.');
				return;
			}
			onMapGenerated(await res.json());
		}
		finally
		{
			setMapping(false);
		}
	}

	const handleSubmit = useCallback(() =>
	{
		if(!draft.trim() || loading) return;
		onSubmit(draft.trim());
		setDraft('');
		setAnalysis(null);
	}, [draft, loading, onSubmit]);

	useEffect(() =>
	{
		function onKeyDown(e: KeyboardEvent)
		{
			if(e.key === 'Enter' && (e.metaKey || e.ctrlKey))
				handleSubmit();
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [handleSubmit]);

	const submitLabel = loading
		? 'The Bench is conferring...'
		: phase === 'rebuttal'
			? 'Submit Final Rebuttal'
			: 'Address the Court';

	return (
		<div className="flex flex-col gap-4">
			<Textarea
				placeholder={phase === 'rebuttal'
					? 'Your Honor, the Court should rule in our favor because...'
					: 'Your Honor, I respectfully submit...'
				}
				value={draft}
				onChange={e => setDraft(e.target.value)}
				disabled={loading}
				rows={8}
				className="resize-none"
			/>

			<div className="flex flex-col gap-2">
				<div className="flex gap-2">
					<button
						onClick={handleStressTest}
						disabled={!draft.trim() || analyzing || loading}
						className={cn(
							'flex-1 px-3 py-2 rounded-md border text-xs font-medium transition-colors',
							'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40',
							'disabled:opacity-40 disabled:cursor-not-allowed',
						)}
					>
						{analyzing ? 'Analyzing...' : 'Stress Test →'}
					</button>
					<button
						onClick={handleMap}
						disabled={!draft.trim() || mapping || loading}
						className={cn(
							'flex-1 px-3 py-2 rounded-md border text-xs font-medium transition-colors',
							'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40',
							'disabled:opacity-40 disabled:cursor-not-allowed',
						)}
					>
						{mapping ? 'Mapping...' : 'Map Arguments'}
					</button>
				</div>
				<Button
					className="w-full"
					onClick={handleSubmit}
					disabled={!draft.trim() || loading}
				>
					{submitLabel}
				</Button>
				<div className="flex items-center justify-between">
					<span className="text-[11px] text-muted-foreground">⌘↵ to submit</span>
					{error && <span className="text-[11px] text-destructive">{error}</span>}
				</div>
			</div>

			{analysis && (
				<div className="flex flex-col gap-5 pt-2">
					<div className="flex flex-col gap-2">
						<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Stress Test</p>
						<div className="flex flex-col gap-2.5">
							{analysis.scores && (Object.entries(analysis.scores) as [string, number][]).map(([key, score]) => (
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

					{analysis.weaknesses?.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Weaknesses</p>
							{analysis.weaknesses.map((w, i) => (
								<p key={i} className="text-xs text-foreground leading-relaxed pl-3 border-l-2 border-border">
									{w}
								</p>
							))}
						</div>
					)}

					{analysis.suggestions?.length > 0 && (
						<div className="flex flex-col gap-2">
							<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Suggestions</p>
							{analysis.suggestions.map((s, i) => (
								<p key={i} className="text-xs text-foreground leading-relaxed pl-3 border-l-2 border-border/40">
									{s}
								</p>
							))}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
