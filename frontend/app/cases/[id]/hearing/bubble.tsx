'use client';

import { HearingMessage } from '@/types/hearing';
import { JUDGE_MAP } from './judges';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Props
{
	message: HearingMessage;
}

export default function Bubble({ message }: Props)
{
	const isUser = message.speaker_id === 'user';
	const isCourt = message.speaker_id === 'court';
	const isOpposing = message.speaker_id === 'opposing_counsel';
	const isJustice = !isUser && !isCourt && !isOpposing;
	const philosophy = JUDGE_MAP[message.speaker_id]?.philosophy;

	if(isCourt)
	{
		return (
			<div className="flex justify-center my-2">
				<span className="text-xs text-muted-foreground italic px-4 py-1 border border-border rounded-full bg-muted/30">
					{message.content}
				</span>
			</div>
		);
	}

	return (
		<div className={cn('flex flex-col gap-1 max-w-[80%]', isUser ? 'self-end items-end' : 'self-start items-start')}>
			<div className="flex items-center gap-2">
				{!isUser && (
					<span className="text-xs font-medium text-foreground">{message.speaker}</span>
				)}
				{isJustice && philosophy && (
					<Badge variant="outline" className="text-[10px] px-1.5 py-0">
						{philosophy}
					</Badge>
				)}
				{isOpposing && (
					<Badge variant="outline" className="text-[10px] px-1.5 py-0">Opposing Counsel</Badge>
				)}
			</div>
			<div
				className={cn(
					'rounded-2xl px-4 py-3 text-sm leading-relaxed',
					isUser
						? 'bg-primary text-primary-foreground rounded-tr-sm'
						: isOpposing
							? 'bg-muted text-foreground italic rounded-tl-sm border border-border'
							: 'bg-muted text-foreground rounded-tl-sm',
				)}
			>
				{message.content}
			</div>
		</div>
	);
}
