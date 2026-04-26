'use client';

import { MultiplayerMatch } from "@/types/multiplayer";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { API_URL } from "@/lib/api";

interface Props
{
	match: MultiplayerMatch;
	userId: string;
}

function statusLabel(status: MultiplayerMatch['status'])
{
	if(status === 'waiting') return 'Waiting for opponent';
	if(status === 'active') return 'In progress';
	return 'Concluded';
}

function statusVariant(status: MultiplayerMatch['status']): 'secondary' | 'default' | 'outline'
{
	if(status === 'waiting') return 'secondary';
	if(status === 'active') return 'default';
	return 'outline';
}

export default function MatchRow({ match, userId }: Props)
{
	const router = useRouter();
	const [cancelling, setCancelling] = useState(false);
	const [cancelled, setCancelled] = useState(false);

	if(cancelled) return null;

	const isPlaintiff = match.plaintiff?.user_id === userId;
	const mySide = isPlaintiff ? 'Plaintiff' : 'Defense';
	const opponent = isPlaintiff ? match.defendant : match.plaintiff;
	const href = match.status === 'concluded'
		? `/match/${match.match_id}/results`
		: `/match/${match.match_id}`;

	const showCancel = match.status === 'waiting' || match.status === 'active';

	async function handleCancel(e: React.MouseEvent)
	{
		e.preventDefault();
		e.stopPropagation();
		setCancelling(true);

		try
		{
			const res = await fetch(`${API_URL}/multiplayer/${match.match_id}`, {
				method: 'DELETE',
			});

			if(res.ok)
			{
				setCancelled(true);
				router.refresh();
			}
		}
		catch
		{
			setCancelling(false);
		}
	}

	return (
		<a
			href={href}
			className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border border-border hover:bg-muted/40 transition-colors"
		>
			<div className="flex flex-col gap-0.5 min-w-0">
				<span className="text-sm font-medium truncate">{match.case_name}</span>
				<span className="text-xs text-muted-foreground">
					{mySide} · vs {opponent?.user_name ?? 'Waiting for opponent'}
				</span>
			</div>
			<div className="flex items-center gap-2 shrink-0">
				{showCancel && (
					<button
						onClick={handleCancel}
						disabled={cancelling}
						className="text-[10px] text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 disabled:cursor-not-allowed px-1.5 py-0.5 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
					>
						{cancelling ? 'Cancelling...' : 'Cancel'}
					</button>
				)}
				<Badge variant={statusVariant(match.status)} className="text-[10px]">
					{statusLabel(match.status)}
				</Badge>
			</div>
		</a>
	);
}
