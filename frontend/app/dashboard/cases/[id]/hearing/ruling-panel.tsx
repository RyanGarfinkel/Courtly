'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface JudgeVote
{
	judge_id: string;
	judge_name: string;
	vote: 'for' | 'against';
	opinion_type: 'majority' | 'concurrence' | 'dissent';
	opinion: string;
}

interface HearingScores
{
	consistency: number;
	precedent: number;
	responsiveness: number;
	overall: number;
}

interface HearingRuling
{
	result: 'affirmed' | 'reversed';
	vote_for: number;
	vote_against: number;
	majority_opinion: JudgeVote;
	concurrences: JudgeVote[];
	dissents: JudgeVote[];
	scores: HearingScores;
	swing_justices: string[];
}

interface Props
{
	ruling: HearingRuling;
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

export default function RulingPanel({ ruling, side }: Props)
{
	const won = ruling.result === 'affirmed';
	const voteStr = `${ruling.vote_for}–${ruling.vote_against}`;

	return (
		<div className="flex flex-col gap-4 py-4">
			<div className="text-center flex flex-col items-center gap-2">
				<div className={cn(
					'text-5xl font-black tracking-tight',
					won ? 'text-foreground' : 'text-muted-foreground',
				)}>
					{ruling.result.toUpperCase()}
				</div>
				<div className="text-sm text-muted-foreground">
					{voteStr} · {won ? 'Judgment in your favor' : 'Judgment against you'}
				</div>
			</div>

			<Card>
				<CardHeader className="pb-2 pt-4 px-4">
					<CardTitle className="text-sm">Performance Scores</CardTitle>
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
				<CardHeader className="pb-2 pt-4 px-4">
					<div className="flex items-center gap-2">
						<CardTitle className="text-sm">{ruling.majority_opinion.judge_name}</CardTitle>
						<Badge variant="secondary" className="text-[10px]">Majority</Badge>
					</div>
				</CardHeader>
				<CardContent className="px-4 pb-4">
					<p className="text-sm text-muted-foreground leading-relaxed italic">
						"{ruling.majority_opinion.opinion}"
					</p>
				</CardContent>
			</Card>

			{ruling.concurrences.length > 0 && (
				<div className="flex flex-col gap-2">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Concurrences</p>
					{ruling.concurrences.map(v => (
						<Card key={v.judge_id}>
							<CardContent className="px-4 py-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="text-xs font-medium">{v.judge_name}</span>
									<Badge variant="outline" className="text-[10px]">Concurs</Badge>
								</div>
								<p className="text-xs text-muted-foreground italic">"{v.opinion}"</p>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{ruling.dissents.length > 0 && (
				<div className="flex flex-col gap-2">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dissents</p>
					{ruling.dissents.map(v => (
						<Card key={v.judge_id}>
							<CardContent className="px-4 py-3">
								<div className="flex items-center gap-2 mb-1">
									<span className="text-xs font-medium">{v.judge_name}</span>
									<Badge variant="outline" className="text-[10px]">Dissents</Badge>
								</div>
								<p className="text-xs text-muted-foreground italic">"{v.opinion}"</p>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{ruling.swing_justices.length > 0 && (
				<p className="text-xs text-muted-foreground text-center">
					Swing justices: {ruling.swing_justices.join(', ')}
				</p>
			)}
		</div>
	);
}
