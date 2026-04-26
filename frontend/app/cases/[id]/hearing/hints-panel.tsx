'use client';

import { useEffect, useCallback, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import SidePanel from './side-panel';
import { API_URL } from '@/lib/api';

interface Props
{
	open: boolean;
	onClose: () => void;
	hearingId: string;
}

export default function HintsPanel({ open, onClose, hearingId }: Props)
{
	const [hints, setHints] = useState<string[] | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fetchedId, setFetchedId] = useState<string | null>(null);

	const fetchHints = useCallback(async () =>
	{
		if(loading) return;
		setLoading(true);
		setError(null);
		try
		{
			const res = await fetch(`${API_URL}/hearing/hint`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ hearing_id: hearingId }),
			});
			if(!res.ok)
			{
				setError('Could not load hints. Please try again.');
				return;
			}
			const data = await res.json();
			setHints(data.hints);
			setFetchedId(hearingId);
		}
		finally
		{
			setLoading(false);
		}
	}, [hearingId, loading]);

	useEffect(() =>
	{
		if(open && hints === null && fetchedId !== hearingId) fetchHints();
	}, [open, hints, hearingId, fetchedId, fetchHints]);

	return (
		<SidePanel title="Hints" onClose={onClose}>
			<div className="flex flex-col gap-4">
				{loading && (
					<div className="flex flex-col gap-3">
						<Skeleton className="h-3 w-3/4" />
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-5/6" />
						<Skeleton className="h-3 w-2/3" />
						<Skeleton className="h-3 w-4/5" />
					</div>
				)}

				{error && (
					<div className="flex flex-col gap-3">
						<p className="text-xs text-destructive">{error}</p>
						<button
							onClick={fetchHints}
							className="text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
						>
							Try again
						</button>
					</div>
				)}

				{hints && !loading && (
					<div className="flex flex-col gap-2">
						<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Suggested Angles</p>
						<div className="flex flex-col gap-3">
							{hints.map((hint, i) => (
								<div key={i} className="text-xs text-foreground leading-relaxed pl-3 border-l-2 border-primary/40">
									{hint}
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</SidePanel>
	);
}
