'use client';

import { JUDGE_MAP } from './judges';
import { cn } from '@/lib/utils';

interface Props
{
	displayedQuestion: string;
	speaker: string | null;
	speakerId: string | null;
	isAnimating: boolean;
	phase: string;
	loading: boolean;
	type?: string;
}

export default function QuestionCard({ displayedQuestion, speaker, speakerId, isAnimating, phase, loading, type }: Props)
{
	const judge = speakerId ? JUDGE_MAP[speakerId] : null;
	const philosophy = judge?.philosophy ?? null;

	const isAside = type === 'aside';
	const isPress = type === 'press';

	if(loading && !displayedQuestion)
	{
		return (
			<div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-3 py-4">
				<div className="flex items-center gap-2">
					<span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
					<span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
					<span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
				</div>
				<p className="text-sm text-muted-foreground italic">The bench is conferring…</p>
			</div>
		);
	}

	if(!displayedQuestion && !loading)
	{
		return (
			<div className="w-full max-w-2xl mx-auto py-4 text-center">
				<p className="text-sm text-muted-foreground italic">Awaiting the bench…</p>
			</div>
		);
	}

	return (
		<div
			className={cn(
				'w-full max-w-2xl mx-auto flex flex-col gap-2',
				isAside && 'pl-4 border-l-2 border-muted-foreground/30',
			)}
		>
			{speaker && (
				<p
					className={cn(
						'text-[10px] font-semibold tracking-[0.15em] uppercase',
						isAside ? 'text-muted-foreground/60' : 'text-muted-foreground',
					)}
				>
					{isAside && (
						<span className="mr-1 opacity-50">│</span>
					)}
					{speaker}
					{philosophy && (
						<span className="ml-2 font-normal tracking-normal normal-case opacity-60">· {philosophy}</span>
					)}
					{isAside && (
						<span className="ml-2 font-normal tracking-normal normal-case opacity-50 italic">Overheard from the bench</span>
					)}
				</p>
			)}

			<p
				className={cn(
					'text-base leading-relaxed',
					isAside ? 'text-muted-foreground text-sm italic' : 'text-foreground',
				)}
			>
				{isPress && (
					<span className="text-amber-500 dark:text-amber-400 mr-1.5 font-medium">↳</span>
				)}
				{displayedQuestion}
				{isAnimating && (
					<span className="typewriter-cursor ml-0.5 text-muted-foreground">|</span>
				)}
			</p>
		</div>
	);
}
