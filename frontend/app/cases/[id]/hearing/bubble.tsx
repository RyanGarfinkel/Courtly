'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface HearingMessage
{
	id: string;
	speaker: string;
	speaker_id: string;
	content: string;
	type: string;
}

interface Props
{
	message: HearingMessage;
}

const PHILOSOPHY_LABELS: Record<string, string> = {
	hale: 'Textualist',
	okafor: 'Original Intent',
	voss: 'Living Const.',
	crane: 'Pragmatist',
	mirande: 'Civil Libertarian',
	ashworth: 'Structuralist',
	lim: 'Precedent-First',
	ndidi: 'Natural Law',
	solis: 'Balancing Test',
};

export default function Bubble({ message }: Props)
{
	const isUser = message.speaker_id === 'user';
	const isCourt = message.speaker_id === 'court';
	const isOpposing = message.speaker_id === 'opposing_counsel';
	const isJustice = !isUser && !isCourt && !isOpposing;

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
				{isJustice && PHILOSOPHY_LABELS[message.speaker_id] && (
					<Badge variant="outline" className="text-[10px] px-1.5 py-0">
						{PHILOSOPHY_LABELS[message.speaker_id]}
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
