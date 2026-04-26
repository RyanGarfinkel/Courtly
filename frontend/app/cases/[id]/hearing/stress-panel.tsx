'use client';

import { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import SidePanel from './side-panel';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StressResult
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
	onClose: () => void;
	hearingId: string;
	pendingQuestion: { id: string; speaker: string; content: string } | null;
	draft: string;
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

export default function StressPanel({ onClose, hearingId, pendingQuestion, draft }: Props)
{
	const [result, setResult] = useState<StressResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function runStressTest()
	{
		if(!draft.trim() || loading) return;
		setLoading(true);
		setResult(null);
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
			setResult(await res.json());
		}
		finally
		{
			setLoading(false);
		}
	}

	return (
		<SidePanel title="Stress Test" onClose={onClose}>
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
					onClick={runStressTest}
					disabled={!draft.trim() || loading}
					className={cn(
						'w-full px-4 py-2.5 rounded-md border text-xs font-medium transition-colors',
						'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40',
						'disabled:opacity-40 disabled:cursor-not-allowed',
						'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground',
					)}
				>
					{loading ? 'Analyzing…' : 'Run Stress Test →'}
				</button>

				{error && <p className="text-xs text-destructive">{error}</p>}

				{loading && (
					<div className="flex flex-col gap-2.5">
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-5/6" />
						<Skeleton className="h-3 w-3/4" />
						<Skeleton className="h-3 w-full" />
					</div>
				)}

				{result && !loading && (
					<div className="flex flex-col gap-5">
						<div className="flex flex-col gap-2">
							<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Scores</p>
							<div className="flex flex-col gap-2.5">
								{(Object.entries(result.scores) as [string, number][]).map(([key, score]) => (
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

						{result.weaknesses?.length > 0 && (
							<div className="flex flex-col gap-2">
								<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Weaknesses</p>
								{result.weaknesses.map((w, i) => (
									<p key={i} className="text-xs text-foreground leading-relaxed pl-3 border-l-2 border-border">{w}</p>
								))}
							</div>
						)}

						{result.suggestions?.length > 0 && (
							<div className="flex flex-col gap-2">
								<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Suggestions</p>
								{result.suggestions.map((s, i) => (
									<p key={i} className="text-xs text-foreground leading-relaxed pl-3 border-l-2 border-border/40">{s}</p>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</SidePanel>
	);
}
