'use client';

import { JUDGES } from './judges';
import { cn } from '@/lib/utils';

interface Props
{
	activeSpeakerId: string | null;
	spokenIds: Set<string>;
}

export default function BenchHeader({ activeSpeakerId, spokenIds }: Props)
{
	return (
		<div className="flex items-center justify-center gap-3 py-3 border-b border-border bg-muted/20 rounded-lg px-4">
			{JUDGES.map(j => (
				<div
					key={j.id}
					className="flex flex-col items-center gap-1 group relative"
					title={`${j.name} · ${j.philosophy}`}
				>
					<div className={cn(
						'w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all duration-200',
						activeSpeakerId === j.id
							? 'bg-foreground text-background ring-2 ring-foreground ring-offset-2 ring-offset-background'
							: spokenIds.has(j.id)
								? 'bg-muted-foreground/20 text-foreground border border-border'
								: 'bg-muted text-muted-foreground border border-border/50',
					)}>
						{j.short}
					</div>
					<span className={cn(
						'text-[9px] whitespace-nowrap transition-colors',
						activeSpeakerId === j.id ? 'text-foreground font-medium' : 'text-muted-foreground',
					)}>
						{j.name.replace('Justice ', '')}
					</span>
				</div>
			))}
		</div>
	);
}
