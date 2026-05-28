'use client';

import { HearingMessage } from '@/types/hearing';
import { cn } from '@/lib/utils';

interface Props
{
	message: HearingMessage;
	onAddNote?: (messageId: string, messageText: string, speaker: string) => void;
}

const NoteIcon = () => (
	<svg width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
		<path d='M12 20h9' />
		<path d='M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z' />
	</svg>
);

export default function Bubble({ message, onAddNote }: Props)
{
	const isUser = message.speaker_id === 'user';
	const isCourt = message.speaker_id === 'court';
	const isAside = message.type === 'aside';
	const isPress = message.type === 'press';
	const isNoteable = !isUser && !isCourt && !isAside && !!onAddNote;

	if(isCourt)
	{
		return (
			<div className='flex justify-center py-0.5'>
				<span className='text-[10px] text-muted-foreground/60 italic px-3 py-0.5 border border-border/50 rounded-full bg-muted/20'>
					{message.content}
				</span>
			</div>
		);
	}

	if(isAside)
	{
		return (
			<div className='pl-4 border-l border-muted-foreground/20 py-0.5'>
				<p className='text-[10px] text-muted-foreground/50 italic leading-snug line-clamp-1'>
					<span className='not-italic opacity-70 mr-1'>│</span>
					{message.speaker}: {message.content}
				</p>
			</div>
		);
	}

	const speakerLabel = isUser ? 'You' : message.speaker;

	return (
		<div className={cn('group flex gap-1.5 items-baseline py-0.5', isUser && 'flex-row-reverse')}>
			<span
				className={cn(
					'text-[10px] font-medium shrink-0',
					isUser ? 'text-primary/70' : 'text-muted-foreground',
				)}
			>
				{speakerLabel}:
			</span>
			<p
				className={cn(
					'text-[11px] leading-snug text-foreground/80 line-clamp-1 flex-1',
					isPress && 'text-amber-600 dark:text-amber-400',
				)}
			>
				{isPress && <span className='mr-1 opacity-70'>↳</span>}
				{message.content}
			</p>
			{isNoteable && (
				<button
					type='button'
					onClick={() => onAddNote!(message.id, message.content, message.speaker)}
					className='shrink-0 text-muted-foreground/30 hover:text-primary transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded'
					aria-label='Add note'
				>
					<NoteIcon />
				</button>
			)}
		</div>
	);
}
