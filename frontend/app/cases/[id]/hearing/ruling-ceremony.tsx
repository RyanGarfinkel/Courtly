'use client';

import { HearingRuling, JudgeVote } from '@/types/hearing';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { JUDGES, JUDGE_MAP } from './judges';
import { cn } from '@/lib/utils';

interface Props
{
	ruling: HearingRuling;
	side: 'plaintiff' | 'defendant';
}

type Phase = 'conference' | 'returning' | 'swing' | 'voting' | 'opinions';

const ScoreBar = ({ label, value }: { label: string; value: number }) =>
{
	return (
		<div className="flex flex-col gap-1">
			<div className="flex justify-between text-xs">
				<span className="text-muted-foreground">{label}</span>
				<span className="font-medium">{Math.round(value)}</span>
			</div>
			<div className="h-1.5 bg-muted rounded-full overflow-hidden">
				<div
					className="h-full bg-foreground/60 rounded-full transition-all duration-700"
					style={{ width: `${value}%` }}
				/>
			</div>
		</div>
	);
};

const BenchRow = ({
	phase,
	returnedCount,
	swingNames,
}: {
	phase: Phase;
	returnedCount: number;
	swingNames: string[];
}) =>
{
	const isConference = phase === 'conference';

	return (
		<div className="flex justify-center gap-2 mb-6">
			{JUDGES.map((judge, i) =>
			{
				const lit = !isConference && i < returnedCount;
				const isSwing = swingNames.includes(judge.name) && (phase === 'swing' || phase === 'voting' || phase === 'opinions');

				return (
					<div
						key={judge.id}
						className={cn(
							'flex flex-col items-center gap-1 transition-all duration-300',
							isConference && 'opacity-30',
							lit && !isConference && 'opacity-100',
							!lit && !isConference && 'opacity-30',
						)}
						style={{ transitionDelay: isConference ? '0ms' : `${i * 60}ms` }}
					>
						<div
							className={cn(
								'w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold transition-all duration-300',
								isConference
									? 'bg-muted text-muted-foreground'
									: lit
										? 'bg-foreground text-background'
										: 'bg-muted text-muted-foreground',
								isSwing && 'ring-2 ring-offset-1 ring-amber-500 scale-110',
							)}
						>
							{judge.short}
						</div>
					</div>
				);
			})}
		</div>
	);
};

const VoteRow = ({ vote, visible }: { vote: JudgeVote; visible: boolean }) =>
{
	const inMajority = vote.opinion_type !== 'dissent';
	const judge = JUDGE_MAP[vote.judge_id];

	return (
		<div
			className={cn(
				'flex items-center justify-between px-3 py-2 rounded-md border border-border transition-all duration-500',
				visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
				inMajority ? 'bg-card' : 'bg-muted/30',
			)}
		>
			<div className="flex items-center gap-2">
				<span
					className={cn(
						'text-sm font-medium',
						inMajority ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400',
					)}
				>
					{inMajority ? '✓' : '✗'}
				</span>
				<span className="text-xs font-medium">{vote.judge_name}</span>
				{judge && <span className="text-[10px] text-muted-foreground hidden sm:inline">{judge.philosophy}</span>}
			</div>
			<Badge
				variant={vote.opinion_type === 'majority' ? 'secondary' : 'outline'}
				className="text-[9px] capitalize"
			>
				{vote.opinion_type}
			</Badge>
		</div>
	);
};

const OpinionCard = ({
	vote,
	visible,
	typewrittenText,
	isTyping,
}: {
	vote: JudgeVote;
	visible: boolean;
	typewrittenText?: string;
	isTyping?: boolean;
}) =>
{
	const inMajority = vote.opinion_type !== 'dissent';
	const isMajority = vote.opinion_type === 'majority';
	const judge = JUDGE_MAP[vote.judge_id];

	const displayText = typewrittenText !== undefined ? typewrittenText : vote.opinion;

	return (
		<div
			className={cn(
				'transition-all duration-700',
				visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3',
			)}
		>
			<Card className={cn(!inMajority && 'opacity-70')}>
				<CardContent className="px-4 py-4">
					<div className="flex items-start justify-between gap-3 mb-2.5">
						<div>
							<p className={cn('font-medium', isMajority ? 'text-sm' : 'text-xs')}>{vote.judge_name}</p>
							{judge && <p className="text-xs text-muted-foreground">{judge.philosophy}</p>}
						</div>
						<div className="flex items-center gap-1.5 shrink-0">
							<Badge
								variant={isMajority ? 'secondary' : 'outline'}
								className="text-[10px]"
							>
								{isMajority ? 'Majority' : vote.opinion_type === 'concurrence' ? 'Concurrence' : 'Dissent'}
							</Badge>
							<Badge variant="outline" className={cn('text-[10px]', !inMajority && 'text-muted-foreground')}>
								{vote.vote === 'for' ? 'Affirms' : 'Reverses'}
							</Badge>
						</div>
					</div>
					<p
						className={cn(
							'text-xs leading-relaxed italic text-muted-foreground',
							isMajority && 'text-sm',
						)}
					>
						"{displayText}
						{isTyping && (
							<span className="typewriter-cursor inline-block w-0.5 h-3.5 bg-foreground ml-0.5 align-middle" />
						)}
						{!isTyping && displayText === vote.opinion && '"'}
					</p>
				</CardContent>
			</Card>
		</div>
	);
};

export default function RulingCeremony({ ruling, side }: Props)
{
	const [phase, setPhase] = useState<Phase>('conference');
	const [returnedCount, setReturnedCount] = useState(0);
	const [swingShown, setSwingShown] = useState(false);
	const [revealedVotes, setRevealedVotes] = useState<JudgeVote[]>([]);
	const [revealedOpinions, setRevealedOpinions] = useState(0);
	const [displayedMajority, setDisplayedMajority] = useState('');
	const [majorityDone, setMajorityDone] = useState(false);
	const [skipped, setSkipped] = useState(false);

	const won = ruling.result === 'affirmed';
	const voteFor = revealedVotes.filter(v => v.opinion_type !== 'dissent').length;
	const voteAgainst = revealedVotes.filter(v => v.opinion_type === 'dissent').length;

	const sortedVotes: JudgeVote[] = [
		ruling.majority_opinion,
		...ruling.concurrences,
		...ruling.dissents,
	];

	const swingNames = ruling.swing_justices;
	const secondaryOpinions = [...ruling.concurrences, ...ruling.dissents];

	const skipAll = () =>
	{
		setSkipped(true);
		setPhase('opinions');
		setReturnedCount(9);
		setSwingShown(true);
		setRevealedVotes(sortedVotes);
		setDisplayedMajority(ruling.majority_opinion.opinion);
		setMajorityDone(true);
		setRevealedOpinions(secondaryOpinions.length);
	};

	useEffect(() =>
	{
		if(skipped) return;
		const t1 = setTimeout(() => setPhase('returning'), 3000);
		return () => clearTimeout(t1);
	}, [skipped]);

	useEffect(() =>
	{
		if(skipped || phase !== 'returning') return;
		const hasSwing = swingNames.length > 0;
		let count = 0;
		const interval = setInterval(() =>
		{
			count++;
			setReturnedCount(count);
			if(count >= 9)
			{
				clearInterval(interval);
				setTimeout(() =>
				{
					if(hasSwing)
						setPhase('swing');
					else
						setPhase('voting');
				}, 500);
			}
		}, 200);
		return () => clearInterval(interval);
	}, [phase, skipped, swingNames.length]);

	useEffect(() =>
	{
		if(skipped || phase !== 'swing') return;
		setSwingShown(true);
		const t = setTimeout(() => setPhase('voting'), 2000);
		return () => clearTimeout(t);
	}, [phase, skipped]);

	useEffect(() =>
	{
		if(skipped || phase !== 'voting') return;
		let idx = 0;
		const interval = setInterval(() =>
		{
			idx++;
			setRevealedVotes(sortedVotes.slice(0, idx));
			if(idx >= sortedVotes.length)
			{
				clearInterval(interval);
				setTimeout(() => setPhase('opinions'), 1000);
			}
		}, 700);
		return () => clearInterval(interval);
	}, [phase, skipped]);

	useEffect(() =>
	{
		if(skipped || phase !== 'opinions') return;
		const text = ruling.majority_opinion.opinion;
		let i = 0;
		const typeInterval = setInterval(() =>
		{
			i++;
			setDisplayedMajority(text.slice(0, i));
			if(i >= text.length)
			{
				clearInterval(typeInterval);
				setMajorityDone(true);
				let opinionIdx = 0;
				const opinionInterval = setInterval(() =>
				{
					opinionIdx++;
					setRevealedOpinions(opinionIdx);
					if(opinionIdx >= secondaryOpinions.length)
						clearInterval(opinionInterval);
				}, 1500);
			}
		}, 20);
		return () => clearInterval(typeInterval);
	}, [phase, skipped]);

	const showVerdictBanner = phase === 'voting' || phase === 'opinions';

	return (
		<div className="flex flex-col gap-6 py-4 relative">
			<div className="absolute top-0 right-0">
				<Button
					variant="ghost"
					size="sm"
					onClick={skipAll}
					className="text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					Skip ceremony →
				</Button>
			</div>

			<BenchRow
				phase={phase}
				returnedCount={returnedCount}
				swingNames={swingNames}
			/>

			{phase === 'conference' && (
				<div className="flex flex-col items-center justify-center gap-6 py-12">
					<p className="text-sm text-muted-foreground italic tracking-wide">
						The Justices have retired to conference.
					</p>
					<div className="w-6 h-6 rounded-full border-2 border-muted-foreground/30 border-t-foreground/70 animate-spin" />
				</div>
			)}

			{phase === 'returning' && (
				<div className="flex flex-col items-center justify-center gap-4 py-10">
					<p className="text-sm text-muted-foreground italic tracking-wide animate-pulse">
						The Court is returning to the bench…
					</p>
				</div>
			)}

			{phase === 'swing' && swingShown && swingNames.length > 0 && (
				<div className="flex flex-col items-center justify-center gap-3 py-8">
					<div
						className={cn(
							'text-center px-6 py-4 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20',
							'transition-all duration-500 opacity-100 scale-100',
						)}
					>
						<p className="text-xs font-medium text-amber-700 dark:text-amber-400 uppercase tracking-widest mb-1">
							Deciding Vote
						</p>
						<p className="text-sm font-semibold">
							{swingNames.join(' & ')} cast the deciding {swingNames.length === 1 ? 'vote' : 'votes'}.
						</p>
					</div>
				</div>
			)}

			{showVerdictBanner && (
				<div
					className={cn(
						'text-center flex flex-col items-center gap-3 py-8 border-b border-border',
						'transition-all duration-500',
					)}
				>
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
						The Court's Decision
					</p>
					<div
						className={cn(
							'text-5xl font-black tracking-tight transition-all duration-500',
							won ? 'text-foreground' : 'text-muted-foreground/60',
						)}
					>
						{ruling.result.toUpperCase()}
					</div>
					{revealedVotes.length > 0 && (
						<div className="flex items-center gap-3 transition-all duration-300">
							<span className="text-lg font-bold tabular-nums">
								{voteFor} — {voteAgainst}
							</span>
							<span className="text-muted-foreground text-sm">·</span>
							<span className="text-sm text-muted-foreground">
								{won ? 'Judgment in your favor' : 'Judgment against you'}
							</span>
						</div>
					)}
				</div>
			)}

			{phase === 'voting' && (
				<div className="flex flex-col gap-2">
					<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
						Vote Tally
					</p>
					{sortedVotes.map((vote, i) => (
						<VoteRow
							key={vote.judge_id}
							vote={vote}
							visible={revealedVotes.length > i}
						/>
					))}
				</div>
			)}

			{phase === 'opinions' && (
				<div className="flex flex-col gap-6">
					<div className="flex flex-col gap-3">
						<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
							Majority Opinion
						</p>
						<OpinionCard
							vote={ruling.majority_opinion}
							visible={true}
							typewrittenText={displayedMajority}
							isTyping={!majorityDone}
						/>
					</div>

					{majorityDone && ruling.concurrences.length > 0 && (
						<div className="flex flex-col gap-3">
							<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
								Concurrences
							</p>
							{ruling.concurrences.map((v, i) => (
								<OpinionCard
									key={v.judge_id}
									vote={v}
									visible={revealedOpinions > i}
								/>
							))}
						</div>
					)}

					{majorityDone && ruling.dissents.length > 0 && (
						<div className="flex flex-col gap-3">
							<p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
								Dissents
							</p>
							{ruling.dissents.map((v, i) => (
								<OpinionCard
									key={v.judge_id}
									vote={v}
									visible={revealedOpinions > ruling.concurrences.length + i}
								/>
							))}
						</div>
					)}

					{majorityDone && (
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
					)}

					{swingNames.length > 0 && majorityDone && (
						<p className="text-xs text-muted-foreground text-center">
							Swing justices: {swingNames.join(', ')}
						</p>
					)}
				</div>
			)}
		</div>
	);
}
