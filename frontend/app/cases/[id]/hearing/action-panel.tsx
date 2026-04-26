'use client';

import { HearingRuling } from '@/types/hearing';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import AssistantPanel from './assistant-panel';
import ResponseStudio from './response-studio';
import RulingPanel from './ruling-panel';

interface Props
{
	hearingId: string;
	phase: string;
	pendingQuestion: { id: string; speaker: string; content: string } | null;
	onSubmit: (response: string) => void;
	loading: boolean;
	ruling: HearingRuling | null;
	side: 'plaintiff' | 'defendant';
}

type View = 'studio' | 'clerk';

const VIEWS: { id: View; label: string }[] = [
	{ id: 'studio', label: 'Response Studio' },
	{ id: 'clerk', label: 'Law Clerk' },
];

export default function ActionPanel({ hearingId, phase, pendingQuestion, onSubmit, loading, ruling, side }: Props)
{
	const [view, setView] = useState<View>('studio');

	if(ruling)
		return <RulingPanel ruling={ruling} side={side} />;

	return (
		<div className="flex flex-col h-full">
			<div className="flex gap-0 border-b border-border shrink-0 mb-5">
				{VIEWS.map(v => (
					<button
						key={v.id}
						onClick={() => setView(v.id)}
						className={cn(
							'px-3 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px',
							view === v.id
								? 'border-foreground text-foreground'
								: 'border-transparent text-muted-foreground hover:text-foreground/70',
						)}
					>
						{v.label}
					</button>
				))}
			</div>

			<div className="flex-1 flex flex-col min-h-0">
				<div className={cn('flex-1 overflow-y-auto', view !== 'studio' && 'hidden')}>
					<ResponseStudio
						hearingId={hearingId}
						pendingQuestion={pendingQuestion}
						phase={phase}
						onSubmit={onSubmit}
						loading={loading}
					/>
				</div>
				<div className={cn('flex-1 overflow-y-auto', view !== 'clerk' && 'hidden')}>
					<AssistantPanel
						hearingId={hearingId}
						pendingQuestion={pendingQuestion}
					/>
				</div>
			</div>
		</div>
	);
}
