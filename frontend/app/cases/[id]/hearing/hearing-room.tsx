'use client';

import { HearingMessage, HearingRuling } from '@/types/hearing';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useCase } from '@/contexts/case';
import { JUDGES } from './judges';
import { API_URL } from '@/lib/api';
import QuestionCard from './question-card';
import RulingPanel from './ruling-panel';
import CourtIntro from './court-intro';
import StressPanel from './stress-panel';
import HintsPanel from './hints-panel';
import ClerkPanel from './clerk-panel';
import BenchArc from './bench-arc';
import Lectern from './lectern';

interface Props
{
	hearingId: string;
	side: 'plaintiff' | 'defendant';
}

type Panel = 'hints' | 'stress' | 'clerk';

const JUSTICE_IDS = new Set(JUDGES.map(j => j.id));

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
	const [draft, setDraft] = useState('');
	const [openPanel, setOpenPanel] = useState<Panel | null>(null);

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

	async function handleSubmit()
	{
		if(!draft.trim() || loading) return;

		const response = draft.trim();
		setDraft('');

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

			setMessages(prev =>
			{
				const filtered = prev.filter(m => !m.id.startsWith('temp-'));
				return [...filtered, ...data.messages];
			});

			setPhase(data.phase);
			setTurn(data.turn ?? turn);
			if(data.ruling) setRuling(data.ruling);

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
			<div className="flex flex-col gap-4 flex-1 p-8">
				<Skeleton className="h-56 w-full" />
				<Skeleton className="h-24 w-3/4 mx-auto" />
				<Skeleton className="h-36 w-full mt-auto" />
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

	const lastQuestion = [...messages].reverse().find(
		m => (JUSTICE_IDS.has(m.speaker_id) || m.speaker_id === 'court') && m.type === 'question'
	);
	const pendingQuestion = lastQuestion
		? { id: lastQuestion.id, speaker: lastQuestion.speaker, content: lastQuestion.content }
		: null;

	const currentSpeaker = lastQuestion?.speaker ?? null;
	const currentSpeakerId = lastQuestion?.speaker_id ?? null;
	const currentQuestionContent = lastQuestion?.content ?? null;

	return (
		<div className="flex flex-row h-full w-full overflow-hidden">
			<div className="flex-1 flex flex-col min-w-0 relative">
				{ruling && (
					<div className="absolute inset-0 z-30 bg-background overflow-y-auto">
						<RulingPanel ruling={ruling} side={side} />
					</div>
				)}

				<BenchArc activeSpeakerId={activeSpeakerId} spokenIds={spokenIds} />

				<div className="flex-1 flex flex-col items-center justify-center px-8 py-4 gap-6 overflow-hidden">
					<QuestionCard
						speaker={currentSpeaker}
						speakerId={currentSpeakerId}
						content={currentQuestionContent}
						loading={loading}
						phase={phase}
					/>

					<div className="flex items-end justify-between w-full max-w-2xl">
						<AttorneyAvatar label={side === 'plaintiff' ? 'Petitioner (You)' : 'Respondent (You)'} />
						<AttorneyAvatar label={side === 'plaintiff' ? 'Respondent' : 'Petitioner'} dim />
					</div>
				</div>

				<div className="shrink-0 py-5 px-8 relative">
					<div className="max-w-2xl mx-auto">
						<Lectern
							draft={draft}
							onDraftChange={setDraft}
							onSubmit={handleSubmit}
							onHint={() => setOpenPanel('hints')}
							onStressTest={() => setOpenPanel('stress')}
							loading={loading}
							phase={phase}
						/>
					</div>
					<div className="absolute right-8 top-0 bottom-0 flex items-center">
						<ClerkBadge onClick={() => setOpenPanel('clerk')} />
					</div>
				</div>
			</div>

			<div className={`overflow-hidden transition-all duration-300 ease-in-out border-l border-border shrink-0 ${openPanel ? 'w-80' : 'w-0'}`}>
				{openPanel === 'hints' && (
					<HintsPanel
						open={openPanel === 'hints'}
						onClose={() => setOpenPanel(null)}
						hearingId={hearingId}
					/>
				)}
				{openPanel === 'stress' && (
					<StressPanel
						onClose={() => setOpenPanel(null)}
						hearingId={hearingId}
						pendingQuestion={pendingQuestion}
						draft={draft}
					/>
				)}
				{openPanel === 'clerk' && (
					<ClerkPanel
						onClose={() => setOpenPanel(null)}
						hearingId={hearingId}
						pendingQuestion={pendingQuestion}
						messages={messages}
					/>
				)}
			</div>
		</div>
	);
}

function PersonIcon()
{
	return (
		<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
			<circle cx="12" cy="8" r="4" />
			<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
		</svg>
	);
}

function AttorneyAvatar({ label, dim }: { label: string; dim?: boolean })
{
	return (
		<div className="flex flex-col items-center gap-1.5">
			<div className={`w-10 h-10 rounded-full border border-border flex items-center justify-center transition-opacity ${dim ? 'bg-muted/30 text-muted-foreground/40 opacity-50' : 'bg-muted/60 text-muted-foreground'}`}>
				<PersonIcon />
			</div>
			<span className="text-[10px] text-muted-foreground whitespace-nowrap">{label}</span>
		</div>
	);
}

function ClerkBadge({ onClick }: { onClick: () => void })
{
	return (
		<div className="shrink-0 flex flex-col items-center gap-2">
			<div className="w-9 h-9 rounded-full bg-muted/60 border border-border flex items-center justify-center text-muted-foreground">
				<PersonIcon />
			</div>
			<button
				onClick={onClick}
				className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 hover:bg-muted/30 transition-colors"
				title="Ask the clerk"
			>
				<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
				</svg>
				Clerk
			</button>
		</div>
	);
}
