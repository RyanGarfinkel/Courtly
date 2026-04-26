'use client';

import { cn } from '@/lib/utils';

interface Props
{
	speaker: string | null;
	speakerId: string | null;
	content: string | null;
	loading: boolean;
	phase: string;
}

export default function QuestionCard({ speaker, speakerId, content, loading, phase }: Props)
{
	return (
		<div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-2">
			{!loading && speaker && (
				<p className="text-[10px] font-semibold tracking-[0.15em] uppercase text-muted-foreground">
					{speaker}
				</p>
			)}
			<div className={cn(
				'w-full rounded-xl border border-border bg-muted/30 px-8 py-6 flex flex-col gap-3',
				'transition-all duration-300',
			)}>
				{loading
					? (
						<div className="flex flex-col items-center gap-3 py-2">
							<div className="flex items-center gap-2">
								<span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
								<span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
								<span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
							</div>
							<p className="text-sm text-muted-foreground italic">The bench is conferring…</p>
						</div>
					)
					: content
						? (
							<p className="text-base leading-relaxed text-foreground">
								{content}
							</p>
						)
						: (
							<p className="text-sm text-muted-foreground italic text-center py-2">
								Awaiting the bench…
							</p>
						)
				}
			</div>
		</div>
	);
}
