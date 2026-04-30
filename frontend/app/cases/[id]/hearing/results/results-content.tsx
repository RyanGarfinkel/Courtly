'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HearingRuling, JudgeVote } from '@/types/hearing';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { JUDGE_MAP } from '../judges';
import { cn } from '@/lib/utils';

interface Props
{
	hearingId: string;
	side: 'plaintiff' | 'defendant';
}

function ScoreBar({ label, value }: { label: string; value: number })
{
	return (
		<div className="flex flex-col gap-1">
			<div className="flex justify-between text-xs">
				<span className="text-muted-foreground">{label}</span>
				<span className="font-medium">{Math.round(value)}</span>
			</div>
			<div className="h-1.5 bg-muted rounded-full overflow-hidden">
				<div
					className="h-full bg-foreground/60 rounded-full transition-all"
					style={{ width: `${value}%` }}
				/>
			</div>
		</div>
	);
}

function JudgeOpinionCard({ vote, result }: { vote: JudgeVote; result: string })
{
	const judge = JUDGE_MAP[vote.judge_id];
	const inMajority = vote.opinion_type !== 'dissent';
	const opinionLabel =
		vote.opinion_type === 'majority' ? 'Majority' :
		vote.opinion_type === 'concurrence' ? 'Concurrence' : 'Dissent';
	const voteLabel = vote.vote === 'for' ? 'Affirms' : 'Reverses';

	return (
		<Card className={cn(!inMajority && 'opacity-70')}>
			<CardContent className="px-4 py-4">
				<div className="flex items-start justify-between gap-3 mb-2.5">
					<div>
						<p className="text-sm font-medium">{vote.judge_name}</p>
						{judge && <p className="text-xs text-muted-foreground">{judge.philosophy}</p>}
					</div>
					<div className="flex items-center gap-1.5 shrink-0">
						<Badge
							variant={vote.opinion_type === 'majority' ? 'secondary' : 'outline'}
							className="text-[10px]"
						>
							{opinionLabel}
						</Badge>
						<Badge
							variant="outline"
							className={cn('text-[10px]', !inMajority && 'text-muted-foreground')}
						>
							{voteLabel}
						</Badge>
					</div>
				</div>
				<p className="text-xs text-muted-foreground leading-relaxed italic">"{vote.opinion}"</p>
			</CardContent>
		</Card>
	);
}

export default function ResultsContent({ hearingId, side }: Props)
{
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [ruling, setRuling] = useState<HearingRuling | null>(null);

	useEffect(() =>
	{
		const stored = sessionStorage.getItem(`hearing_${hearingId}`);
		if(stored)
		{
			const data = JSON.parse(stored);
			if(data.ruling) setRuling(data.ruling);
		}
		setLoading(false);
	}, [hearingId]);

	if(loading)
	{
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-40 w-full" />
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if(!ruling)
	{
		return (
			<div className="flex flex-col items-center justify-center py-24 gap-4">
				<p className="text-muted-foreground">No ruling found for this hearing.</p>
				<Button variant="outline" onClick={() => router.push('/dashboard')}>
					Back to Dashboard
				</Button>
			</div>
		);
	}

	const won = ruling.result === 'affirmed';
	const voteStr = `${ruling.vote_for}–${ruling.vote_against}`;

	return (
		<div className="flex flex-col gap-8 pb-16">
			<div className="text-center flex flex-col items-center gap-3 py-10 border-b border-border">
				<p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
					The Court's Decision
				</p>
				<div className={cn(
					'text-6xl font-black tracking-tight',
					won ? 'text-foreground' : 'text-muted-foreground/60',
				)}>
					{ruling.result.toUpperCase()}
				</div>
				<div className="flex items-center gap-3">
					<span className="text-xl font-bold tabular-nums">{voteStr}</span>
					<span className="text-muted-foreground text-sm">·</span>
					<span className="text-sm text-muted-foreground">
						{won ? 'Judgment in your favor' : 'Judgment against you'}
					</span>
				</div>
				{ruling.swing_justices.length > 0 && (
					<p className="text-xs text-muted-foreground mt-1">
						Swing justices: {ruling.swing_justices.join(', ')}
					</p>
				)}
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
				<div className="lg:col-span-2 flex flex-col gap-6">
					<div className="flex flex-col gap-3">
						<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
							Majority Opinion
						</p>
						<JudgeOpinionCard vote={ruling.majority_opinion} result={ruling.result} />
					</div>

					{ruling.concurrences.length > 0 && (
						<div className="flex flex-col gap-3">
							<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
								Concurrences
							</p>
							{ruling.concurrences.map(v => (
								<JudgeOpinionCard key={v.judge_id} vote={v} result={ruling.result} />
							))}
						</div>
					)}

					{ruling.dissents.length > 0 && (
						<div className="flex flex-col gap-3">
							<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
								Dissents
							</p>
							{ruling.dissents.map(v => (
								<JudgeOpinionCard key={v.judge_id} vote={v} result={ruling.result} />
							))}
						</div>
					)}
				</div>

				<div className="flex flex-col gap-4 lg:sticky lg:top-6">
					<Card>
						<CardHeader className="pb-2 pt-4 px-4">
							<CardTitle className="text-sm">Your Performance</CardTitle>
						</CardHeader>
						<CardContent className="px-4 pb-4 flex flex-col gap-3">
							<ScoreBar label="Consistency" value={ruling.scores.consistency} />
							<ScoreBar label="Precedent" value={ruling.scores.precedent} />
							<ScoreBar label="Responsiveness" value={ruling.scores.responsiveness} />
							<div className="border-t border-border pt-3">
								<ScoreBar label="Overall" value={ruling.scores.overall} />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="px-4 py-3">
							<div className="flex items-center justify-between text-sm">
								<span className="text-muted-foreground">Your side</span>
								<span className="font-medium capitalize">{side}</span>
							</div>
						</CardContent>
					</Card>

					<Button onClick={() => router.push('/dashboard')} className="w-full">
						Back to Dashboard
					</Button>
				</div>
			</div>
		</div>
	);
}
