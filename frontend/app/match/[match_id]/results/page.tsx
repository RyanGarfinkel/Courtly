'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiplayerMatch, MatchPlayer } from "@/types/multiplayer";
import { HearingState, HearingMessage, JudgeVote } from "@/types/hearing";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Scale, Shield } from "lucide-react";
import { JUDGE_MAP } from "@/app/cases/[id]/hearing/judges";
import { cn } from "@/lib/utils";
import { API_URL } from "@/lib/api";

type Side = 'plaintiff' | 'defendant';

interface HearingData
{
	plaintiff: HearingState | null;
	defendant: HearingState | null;
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

function OpinionBlock({ vote }: { vote: JudgeVote })
{
	const judge = JUDGE_MAP[vote.judge_id];
	const label =
		vote.opinion_type === 'majority' ? 'Majority' :
		vote.opinion_type === 'concurrence' ? 'Concurrence' : 'Dissent';

	return (
		<div className="flex flex-col gap-1 py-2 border-b border-border last:border-0">
			<div className="flex items-center gap-2">
				<span className="text-xs font-medium">{vote.judge_name}</span>
				{judge && <span className="text-[10px] text-muted-foreground">{judge.philosophy}</span>}
				<Badge variant="outline" className="text-[9px] ml-auto shrink-0">{label}</Badge>
			</div>
			<p className="text-[11px] text-muted-foreground leading-relaxed italic">"{vote.opinion}"</p>
		</div>
	);
}

function TranscriptBlock({ messages }: { messages: HearingMessage[] })
{
	const filtered = messages.filter(m =>
		m.type === 'question' || m.speaker_id === 'user'
	);

	if(!filtered.length)
		return <p className="text-xs text-muted-foreground italic">No transcript available.</p>;

	return (
		<div className="flex flex-col gap-3">
			{filtered.map(m => (
				<div key={m.id} className={cn('flex flex-col gap-0.5', m.speaker_id === 'user' && 'items-end')}>
					<span className="text-[10px] font-medium text-muted-foreground">
						{m.speaker_id === 'user' ? 'You' : m.speaker}
					</span>
					<div className={cn(
						'text-xs leading-relaxed px-3 py-2 rounded-lg max-w-[90%]',
						m.speaker_id === 'user'
							? 'bg-primary/10 text-foreground'
							: 'bg-muted/60 text-muted-foreground'
					)}>
						{m.content}
					</div>
				</div>
			))}
		</div>
	);
}

function PlayerColumn({ player, hearing, side }: { player: MatchPlayer; hearing: HearingState | null; side: Side })
{
	const icon = side === 'plaintiff' ? <Scale className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />;
	const label = side === 'plaintiff' ? 'Plaintiff' : 'Defense';

	if(player.status !== 'concluded' || !hearing)
	{
		return (
			<div className="flex flex-col gap-3">
				<div className="flex items-center gap-2">
					{icon}
					<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
				</div>
				<p className="text-sm font-medium">{player.user_name}</p>
				<div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 p-6 flex flex-col items-center gap-2 text-center">
					<p className="text-sm text-muted-foreground">Waiting for opponent to finish...</p>
				</div>
			</div>
		);
	}

	const ruling = player.ruling;
	const won = ruling?.result === 'affirmed';
	const voteStr = ruling ? `${ruling.vote_for}–${ruling.vote_against}` : null;
	const allOpinions = ruling
		? [ruling.majority_opinion, ...ruling.concurrences, ...ruling.dissents]
		: [];

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center gap-2">
				{icon}
				<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
			</div>

			<div className="flex items-baseline gap-3">
				<p className="text-sm font-medium">{player.user_name}</p>
				{voteStr && (
					<span className="text-xs text-muted-foreground tabular-nums">{voteStr}</span>
				)}
			</div>

			{ruling && (
				<div className={cn(
					'text-2xl font-black tracking-tight',
					won ? 'text-foreground' : 'text-muted-foreground/50'
				)}>
					{ruling.result.toUpperCase()}
				</div>
			)}

			{ruling && (
				<Card>
					<CardHeader className="pb-1 pt-3 px-3">
						<CardTitle className="text-xs">Performance</CardTitle>
					</CardHeader>
					<CardContent className="px-3 pb-3 flex flex-col gap-2">
						<ScoreBar label="Consistency" value={ruling.scores.consistency} />
						<ScoreBar label="Precedent" value={ruling.scores.precedent} />
						<ScoreBar label="Responsiveness" value={ruling.scores.responsiveness} />
						<div className="border-t border-border pt-2">
							<ScoreBar label="Overall" value={ruling.scores.overall} />
						</div>
					</CardContent>
				</Card>
			)}

			{allOpinions.length > 0 && (
				<Card>
					<CardHeader className="pb-1 pt-3 px-3">
						<CardTitle className="text-xs">Opinions</CardTitle>
					</CardHeader>
					<CardContent className="px-3 pb-2">
						{allOpinions.map(v => (
							<OpinionBlock key={v.judge_id} vote={v} />
						))}
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader className="pb-1 pt-3 px-3">
					<CardTitle className="text-xs">Transcript</CardTitle>
				</CardHeader>
				<CardContent className="px-3 pb-3 max-h-80 overflow-y-auto">
					<TranscriptBlock messages={hearing.messages} />
				</CardContent>
			</Card>
		</div>
	);
}

function ResultsSkeleton()
{
	return (
		<div className="flex flex-col gap-8">
			<Skeleton className="h-10 w-3/4" />
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<div className="flex flex-col gap-4">
					<Skeleton className="h-6 w-24" />
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-48 w-full" />
				</div>
				<div className="flex flex-col gap-4">
					<Skeleton className="h-6 w-24" />
					<Skeleton className="h-8 w-40" />
					<Skeleton className="h-24 w-full" />
					<Skeleton className="h-48 w-full" />
				</div>
			</div>
		</div>
	);
}

export default function MatchResultsPage()
{
	const params = useParams<{ match_id: string }>();
	const router = useRouter();
	const matchId = params.match_id;

	const [match, setMatch] = useState<MultiplayerMatch | null>(null);
	const [hearings, setHearings] = useState<HearingData>({ plaintiff: null, defendant: null });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	async function load()
	{
		setLoading(true);
		setError(null);

		try
		{
			const matchRes = await fetch(`${API_URL}/multiplayer/${matchId}`);
			if(!matchRes.ok) throw new Error('Match not found');
			const matchData: MultiplayerMatch = await matchRes.json();
			setMatch(matchData);

			const fetchHearing = async (id: string | null): Promise<HearingState | null> =>
			{
				if(!id) return null;
				try
				{
					const res = await fetch(`${API_URL}/hearing/${id}`);
					if(!res.ok) return null;
					return await res.json();
				}
				catch
				{
					return null;
				}
			};

			const [plaintiff, defendant] = await Promise.all([
				fetchHearing(matchData.plaintiff?.hearing_id ?? null),
				fetchHearing(matchData.defendant?.hearing_id ?? null),
			]);

			setHearings({ plaintiff, defendant });
		}
		catch(err)
		{
			setError(err instanceof Error ? err.message : 'Failed to load results');
		}
		finally
		{
			setLoading(false);
		}
	}

	useEffect(() =>
	{
		load();
	}, [matchId]);

	if(loading) return (
		<main className="px-8 py-10">
			<div className="max-w-5xl mx-auto">
				<ResultsSkeleton />
			</div>
		</main>
	);

	if(error || !match) return (
		<main className="px-8 py-10 flex flex-col items-center justify-center gap-4">
			<p className="text-muted-foreground">{error ?? 'Match not found.'}</p>
			<Button variant="outline" onClick={() => router.push('/dashboard')}>
				Back to Dashboard
			</Button>
		</main>
	);

	const bothConcluded = match.plaintiff?.status === 'concluded' && match.defendant?.status === 'concluded';

	return (
		<main className="px-8 py-10">
			<div className="max-w-5xl mx-auto flex flex-col gap-8 pb-16">
				<div className="flex flex-col gap-1">
					<p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
						Head-to-Head Results
					</p>
					<h1 className="text-3xl font-bold tracking-tight">{match.case_name}</h1>
				</div>

				{!bothConcluded && (
					<div className="flex items-center gap-3">
						<p className="text-sm text-muted-foreground">Waiting for all players to finish.</p>
						<Button
							variant="outline"
							size="sm"
							className="flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
							onClick={load}
						>
							<RefreshCw className="w-3.5 h-3.5" />
							Refresh
						</Button>
					</div>
				)}

				<div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
					{match.plaintiff && (
						<PlayerColumn
							player={match.plaintiff}
							hearing={hearings.plaintiff}
							side="plaintiff"
						/>
					)}
					{match.defendant ? (
						<PlayerColumn
							player={match.defendant}
							hearing={hearings.defendant}
							side="defendant"
						/>
					) : (
						<div className="flex flex-col gap-3">
							<div className="flex items-center gap-2">
								<Shield className="w-3.5 h-3.5" />
								<span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Defense</span>
							</div>
							<div className="rounded-lg border border-dashed border-muted-foreground/20 bg-muted/10 p-6 text-center">
								<p className="text-sm text-muted-foreground">No opponent has joined yet.</p>
							</div>
						</div>
					)}
				</div>

				<Button
					variant="outline"
					className="self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					onClick={() => router.push('/dashboard')}
				>
					Back to Dashboard
				</Button>
			</div>
		</main>
	);
}
