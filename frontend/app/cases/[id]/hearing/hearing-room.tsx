'use client';

import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useCase } from '@/contexts/case';
import ActionPanel from './action-panel';
import BenchHeader from './bench-header';
import CourtIntro from './court-intro';
import Bubble from './bubble';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

interface HearingMessage
{
	id: string;
	speaker: string;
	speaker_id: string;
	content: string;
	type: string;
}

interface JudgeVote
{
	judge_id: string;
	judge_name: string;
	vote: 'for' | 'against';
	opinion_type: 'majority' | 'concurrence' | 'dissent';
	opinion: string;
}

interface HearingRuling
{
	result: 'affirmed' | 'reversed';
	vote_for: number;
	vote_against: number;
	majority_opinion: JudgeVote;
	concurrences: JudgeVote[];
	dissents: JudgeVote[];
	scores: { consistency: number; precedent: number; responsiveness: number; overall: number };
	swing_justices: string[];
}

interface Props
{
	hearingId: string;
	side: 'plaintiff' | 'defendant';
}

const PHASE_LABELS: Record<string, string> = {
	interrogation_user: 'Examination',
	rebuttal: 'Rebuttal',
	concluded: 'Deliberation Complete',
};

const JUSTICE_IDS = new Set(['hale', 'okafor', 'voss', 'crane', 'mirande', 'ashworth', 'lim', 'ndidi', 'solis']);

export default function HearingRoom({ hearingId, side }: Props)
{
	const case_ = useCase();
	const [messages, setMessages] = useState<HearingMessage[]>([]);
	const [phase, setPhase] = useState('interrogation_user');
	const [turn, setTurn] = useState(1);
	const [totalTurns, setTotalTurns] = useState(4);
	const [ruling, setRuling] = useState<HearingRuling | null>(null);
	const [loading, setLoading] = useState(false);
	const [initialized, setInitialized] = useState(false);
	const [courtCalled, setCourtCalled] = useState(false);
	const bottomRef = useRef<HTMLDivElement>(null);

	useEffect(() =>
	{
		const stored = sessionStorage.getItem(`hearing_${hearingId}`);
		if(stored)
		{
			const data = JSON.parse(stored);
			setMessages(data.messages ?? []);
			setPhase(data.phase ?? 'interrogation_user');
			setTurn(data.turn ?? 1);
			setTotalTurns(data.total_turns ?? 4);
		}
		setInitialized(true);
	}, [hearingId]);

	useEffect(() =>
	{
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, loading]);

	async function handleSubmit(response: string)
	{
		// Optimistically add user message
		const userMsg: HearingMessage = {
			id: `temp-${Date.now()}`,
			speaker: 'You',
			speaker_id: 'user',
			content: response,
			type: 'statement'
		};
		
		setMessages(prev => [...prev, userMsg]);
		setLoading(true);

		try
		{
			const res = await fetch(`${API_URL}/hearing/turn`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ hearing_id: hearingId, user_response: response }),
			});
			
			if(!res.ok) throw new Error('Failed to submit response');
			
			const data = await res.json();
			
			// Replace temp message and add new ones
			setMessages(prev => {
				const filtered = prev.filter(m => !m.id.startsWith('temp-'));
				return [...filtered, ...data.messages];
			});
			
			setPhase(data.phase);
			setTurn(data.turn ?? turn);
			if(data.ruling) setRuling(data.ruling);

			// Update storage with ALL messages
			sessionStorage.setItem(`hearing_${hearingId}`, JSON.stringify({
				messages: [...messages, ...data.messages],
				phase: data.phase,
				turn: data.turn ?? turn,
				total_turns: totalTurns,
				ruling: data.ruling
			}));
		}
		finally
		{
			setLoading(false);
		}
	}

	if(!initialized)
	{
		return (
			<div className="flex gap-6 flex-1">
				<div className="flex flex-col flex-1 gap-4">
					<Skeleton className="h-12 w-full" />
					<Skeleton className="h-24 w-3/4" />
					<Skeleton className="h-16 w-1/2 self-end" />
					<Skeleton className="h-24 w-2/3" />
				</div>
				<Skeleton className="w-[440px] h-96 shrink-0" />
			</div>
		);
	}

	if(!courtCalled)
	{
		return (
			<CourtIntro
				side={side}
				onBegin={() => setCourtCalled(true)}
			/>
		);
	}

	const lastJusticeMsg = [...messages].reverse().find(m => JUSTICE_IDS.has(m.speaker_id));
	const activeSpeakerId = lastJusticeMsg?.speaker_id ?? null;
	const spokenIds = new Set(messages.filter(m => JUSTICE_IDS.has(m.speaker_id)).map(m => m.speaker_id));

	const lastQuestion = [...messages].reverse().find(m => (JUSTICE_IDS.has(m.speaker_id) || m.speaker_id === 'court') && m.type === 'question');
	const pendingQuestion = lastQuestion ? { id: lastQuestion.id, speaker: lastQuestion.speaker, content: lastQuestion.content } : null;

	const questionsLeft = totalTurns - (turn - 1);
	const progressPct = phase === 'interrogation_user' ? ((turn - 1) / totalTurns) * 100 : 100;

	return (
		<div className="flex gap-8 flex-1 min-h-0 h-full overflow-hidden">
			<div className="flex flex-col flex-1 gap-4 min-w-0 h-full min-h-0">
				<div className="flex items-center justify-between shrink-0">
					<div className="flex items-center gap-3">
						<Badge variant="secondary" className="font-semibold px-3">{PHASE_LABELS[phase] ?? phase}</Badge>
						<Badge variant="outline" className="px-3">{side === 'plaintiff' ? 'Petitioner' : 'Respondent'}</Badge>
					</div>
					{phase === 'interrogation_user' && (
						<span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
							{questionsLeft === 1 ? '1 question remaining' : `${questionsLeft} questions remaining`}
						</span>
					)}
				</div>

				<BenchHeader activeSpeakerId={activeSpeakerId} spokenIds={spokenIds} />

				{phase === 'interrogation_user' && (
					<div className="h-1 bg-muted rounded-full overflow-hidden shrink-0">
						<div
							className="h-full bg-primary/40 rounded-full transition-all duration-700"
							style={{ width: `${progressPct}%` }}
						/>
					</div>
				)}

				<div className="flex-1 flex flex-col gap-4 overflow-y-auto min-h-0 pr-4 -mr-4 scroll-smooth">
					<div className="flex flex-col gap-4 py-2">
						{messages.map(m => (
							<Bubble key={m.id} message={m} />
						))}

						{loading && (
							<div className="flex flex-col gap-2 self-start max-w-[70%] animate-in fade-in slide-in-from-bottom-2">
								<Skeleton className="h-4 w-48" />
								<Skeleton className="h-20 w-full rounded-2xl" />
							</div>
						)}
						<div ref={bottomRef} className="h-4 shrink-0" />
					</div>
				</div>
			</div>

			<div className="w-[420px] shrink-0 border-l border-border pl-8 overflow-y-auto h-full scroll-smooth">
				<ActionPanel
					hearingId={hearingId}
					phase={phase}
					pendingQuestion={pendingQuestion}
					onSubmit={handleSubmit}
					loading={loading}
					ruling={ruling}
					side={side}
				/>
			</div>
		</div>
	);
}
