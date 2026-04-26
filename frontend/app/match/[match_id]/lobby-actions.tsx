'use client';

import { MultiplayerMatch } from "@/types/multiplayer";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/api";
import { Scale, Shield, Clock, RefreshCw } from "lucide-react";

interface Props
{
	match: MultiplayerMatch;
	userId: string | null;
}

function statusVariant(status: MultiplayerMatch['status']): 'secondary' | 'outline' | 'default'
{
	if(status === 'waiting') return 'secondary';
	if(status === 'active') return 'default';
	return 'outline';
}

function statusLabel(status: MultiplayerMatch['status'])
{
	if(status === 'waiting') return 'Waiting for opponent';
	if(status === 'active') return 'In progress';
	return 'Concluded';
}

export default function LobbyActions({ match, userId }: Props)
{
	const router = useRouter();
	const [joining, setJoining] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [pollingActive, setPollingActive] = useState(match.status === 'waiting');

	useEffect(() =>
	{
		if(!pollingActive) return;

		const interval = setInterval(() =>
		{
			router.refresh();
		}, 4000);

		return () => clearInterval(interval);
	}, [pollingActive, router]);

	useEffect(() =>
	{
		if(match.status !== 'waiting') setPollingActive(false);
	}, [match.status]);

	async function handleJoin()
	{
		setJoining(true);
		setError(null);

		try
		{
			const res = await fetch(`${API_URL}/multiplayer/${match.match_id}/join`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
			});

			if(!res.ok)
			{
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error ?? 'Failed to join match');
			}

			const data = await res.json();
			router.push(`/cases/${data.case_id}/brief?side=${data.side}&match_id=${data.match_id}`);
		}
		catch(err)
		{
			setError(err instanceof Error ? err.message : 'Something went wrong');
			setJoining(false);
		}
	}

	const isPlaintiff = userId && match.plaintiff?.user_id === userId;
	const isDefendant = userId && match.defendant?.user_id === userId;
	const isParticipant = isPlaintiff || isDefendant;
	const userSide = isPlaintiff ? 'plaintiff' : isDefendant ? 'defendant' : null;

	return (
		<div className="flex flex-col gap-4">
			<Badge
				variant={statusVariant(match.status)}
				className="self-start px-3 py-1 text-xs font-medium"
			>
				{statusLabel(match.status)}
			</Badge>

			{error && (
				<p className="text-sm text-destructive">{error}</p>
			)}

			{match.status === 'waiting' && !isParticipant && (
				<div className="flex flex-col gap-3">
					<p className="text-sm text-muted-foreground">
						Join as the opposing side to begin the match.
					</p>
					<Button
						onClick={handleJoin}
						disabled={joining}
						size="lg"
						className="w-full h-12 font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					>
						{joining ? (
							<span className="flex items-center gap-2">
								<div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
								Joining...
							</span>
						) : (
							<span className="flex items-center gap-2">
								{match.plaintiff ? (
									<>
										<Shield className="w-4 h-4" />
										Join as Defense
									</>
								) : (
									<>
										<Scale className="w-4 h-4" />
										Join as Plaintiff
									</>
								)}
							</span>
						)}
					</Button>
				</div>
			)}

			{match.status === 'waiting' && isParticipant && (
				<div className="flex flex-col gap-3">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						<Clock className="w-4 h-4 shrink-0" />
						<span>Waiting for your opponent to join...</span>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="self-start flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						onClick={() => router.refresh()}
					>
						<RefreshCw className="w-3.5 h-3.5" />
						Refresh
					</Button>
				</div>
			)}

			{match.status === 'active' && isParticipant && userSide && (
				<Button
					asChild
					size="lg"
					className="w-full h-12 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<a href={`/cases/${match.case_id}/brief?side=${userSide}&match_id=${match.match_id}`}>
						Begin your argument
					</a>
				</Button>
			)}

			{match.status === 'active' && !isParticipant && (
				<p className="text-sm text-muted-foreground">This match is already in progress.</p>
			)}

			{match.status === 'concluded' && (
				<Button
					asChild
					size="lg"
					variant="outline"
					className="w-full h-12 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				>
					<a href={`/match/${match.match_id}/results`}>
						View combined results
					</a>
				</Button>
			)}
		</div>
	);
}
