'use client';

import { useState } from 'react';
import { HearingMessage } from '@/types/hearing';
import AssistantPanel from './assistant-panel';
import SidePanel from './side-panel';
import { JUDGES } from './judges';
import { cn } from '@/lib/utils';

interface Props
{
	onClose: () => void;
	hearingId: string;
	pendingQuestion: { id: string; speaker: string; content: string } | null;
	messages: HearingMessage[];
}

type Tab = 'clerk' | 'history';

const JUSTICE_IDS = new Set(JUDGES.map(j => j.id));

export default function ClerkPanel({ onClose, hearingId, pendingQuestion, messages }: Props)
{
	const [tab, setTab] = useState<Tab>('clerk');

	const history = messages.filter(
		m => (JUSTICE_IDS.has(m.speaker_id) && m.type === 'question') || m.speaker_id === 'user'
	);

	return (
		<SidePanel title="Law Clerk" onClose={onClose}>
			<div className="flex gap-0 border-b border-border -mx-5 px-5 mb-4">
				{(['clerk', 'history'] as Tab[]).map(t => (
					<button
						key={t}
						onClick={() => setTab(t)}
						className={cn(
							'px-3 py-2 text-xs font-medium transition-colors border-b-2 -mb-px capitalize',
							tab === t
								? 'border-foreground text-foreground'
								: 'border-transparent text-muted-foreground hover:text-foreground/70',
						)}
					>
						{t}
					</button>
				))}
			</div>

			{tab === 'clerk' && (
				<AssistantPanel hearingId={hearingId} pendingQuestion={pendingQuestion} />
			)}

			{tab === 'history' && (
				<div className="flex flex-col gap-4">
					{history.length === 0 && (
						<p className="text-xs text-muted-foreground text-center py-4">No exchanges yet.</p>
					)}
					{history.map((m, i) =>
					{
						const isUser = m.speaker_id === 'user';
						return (
							<div key={m.id ?? i} className={cn('flex flex-col gap-1', isUser && 'items-end')}>
								<span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
									{isUser ? 'You' : m.speaker}
								</span>
								<div className={cn(
									'rounded-lg px-3 py-2 text-xs leading-relaxed max-w-[90%]',
									isUser
										? 'bg-foreground text-background'
										: 'bg-muted/40 text-foreground border border-border',
								)}>
									{m.content}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</SidePanel>
	);
}
