'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Props
{
	draft: string;
	onDraftChange: (v: string) => void;
	onSubmit: () => void;
	onStressTest: () => void;
	onClerk: () => void;
	onNotes?: () => void;
	loading: boolean;
	phase: string;
	visible: boolean;
}

const ChatIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
	</svg>
);

const ZapIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
	</svg>
);

const SpinnerIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin" aria-hidden="true">
		<path d="M21 12a9 9 0 1 1-6.219-8.56" />
	</svg>
);

const NoteIcon = () => (
	<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
		<path d="M12 20h9" />
		<path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
	</svg>
);

export default function Lectern({ draft, onDraftChange, onSubmit, onStressTest, onClerk, onNotes, loading, phase, visible }: Props)
{
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const handleSubmit = useCallback(() =>
	{
		if(!draft.trim() || loading) return;
		onSubmit();
	}, [draft, loading, onSubmit]);

	useEffect(() =>
	{
		if(visible && !loading)
			textareaRef.current?.focus();
	}, [visible, loading]);

	const submitLabel = loading
		? 'Submitting…'
		: phase === 'rebuttal'
			? 'Submit Final Rebuttal →'
			: 'Address the Court →';

	return (
		<div className="flex flex-col gap-2 w-full border-t border-border pt-4 px-6 pb-5 bg-background">
			<Textarea
				ref={textareaRef}
				aria-label="Your response"
				placeholder="Your Honor, I respectfully submit…"
				value={draft}
				onChange={e => onDraftChange(e.target.value)}
				disabled={loading}
				rows={4}
				className={cn(
					'resize-none transition-opacity duration-200',
					'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-0',
					loading && 'opacity-60 cursor-not-allowed',
				)}
			/>

			<div className="flex items-center justify-between gap-3">
				<span className="text-[10px] text-muted-foreground select-none">
					⌘/Ctrl+↵ to submit
				</span>

				<div className="flex items-center gap-2">
					{onNotes && (
						<button
							onClick={onNotes}
							disabled={loading}
							aria-label="Open notes"
							className={cn(
								'w-8 h-8 rounded-md border border-border flex items-center justify-center',
								'text-muted-foreground transition-all duration-150',
								'hover:text-foreground hover:border-foreground/40 hover:bg-muted/30',
								'active:scale-[0.97]',
								'disabled:opacity-40 disabled:cursor-not-allowed',
								'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
							)}
						>
							<NoteIcon />
						</button>
					)}

					<button
						onClick={onClerk}
						disabled={loading}
						aria-label="Ask the clerk"
						className={cn(
							'w-8 h-8 rounded-md border border-border flex items-center justify-center',
							'text-muted-foreground transition-all duration-150',
							'hover:text-foreground hover:border-foreground/40 hover:bg-muted/30',
							'active:scale-[0.97]',
							'disabled:opacity-40 disabled:cursor-not-allowed',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
						)}
					>
						<ChatIcon />
					</button>

					<button
						onClick={onStressTest}
						disabled={loading}
						aria-label="Run stress test"
						className={cn(
							'w-8 h-8 rounded-md border border-border flex items-center justify-center',
							'text-muted-foreground transition-all duration-150',
							'hover:text-foreground hover:border-foreground/40 hover:bg-muted/30',
							'active:scale-[0.97]',
							'disabled:opacity-40 disabled:cursor-not-allowed',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
						)}
					>
						<ZapIcon />
					</button>

					<Button
						onClick={handleSubmit}
						disabled={!draft.trim() || loading}
						className={cn(
							'gap-1.5 transition-all duration-150',
							'active:scale-[0.97]',
							'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
						)}
					>
						{loading && <SpinnerIcon />}
						{submitLabel}
					</Button>
				</div>
			</div>
		</div>
	);
}
