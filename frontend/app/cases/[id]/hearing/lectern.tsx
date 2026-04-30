'use client';

import { useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props
{
	draft: string;
	onDraftChange: (v: string) => void;
	onSubmit: () => void;
	onHint: () => void;
	onStressTest: () => void;
	loading: boolean;
	phase: string;
}

export default function Lectern({ draft, onDraftChange, onSubmit, onHint, onStressTest, loading, phase }: Props)
{
	const handleSubmit = useCallback(() =>
	{
		if(!draft.trim() || loading) return;
		onSubmit();
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
		? 'The bench is conferring…'
		: phase === 'rebuttal'
			? 'Submit Final Rebuttal'
			: 'Address the Court';

	return (
		<div className="flex flex-col gap-3 w-full">
			<div className="flex flex-col gap-1">
				<Textarea
					placeholder={phase === 'rebuttal'
						? 'Your Honor, the Court should rule in our favor because…'
						: 'Your Honor, I respectfully submit…'
					}
					value={draft}
					onChange={e => onDraftChange(e.target.value)}
					disabled={loading}
					rows={5}
					className="resize-none"
				/>
				<span className="text-[11px] text-muted-foreground self-end">⌘↵ to submit</span>
			</div>

			<Button
				className="w-full"
				onClick={handleSubmit}
				disabled={!draft.trim() || loading}
			>
				{submitLabel}
			</Button>

			<div className="flex gap-2">
				{(['Hint', 'Stress Test'] as const).map((label) => (
					<button
						key={label}
						onClick={label === 'Hint' ? onHint : onStressTest}
						disabled={loading}
						className={cn(
							'flex-1 px-4 py-2 rounded-md border text-sm font-medium transition-all duration-150',
							'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-muted/30',
							'active:scale-[0.97]',
							'disabled:opacity-40 disabled:cursor-not-allowed',
							'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground',
						)}
					>
						{label}
					</button>
				))}
			</div>
		</div>
	);
}
