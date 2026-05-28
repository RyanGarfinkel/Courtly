'use client';

import { HearingMessage, UIJudge } from '@/types/hearing';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useCase } from '@/contexts/case';
import { JUDGES } from './judges';
import { API_URL } from '@/lib/api';
import QuestionCard from './question-card';
import CourtIntro from './court-intro';
import NotesPanel from './notes-panel';
import StressPanel from './stress-panel';
import HintsPanel from './hints-panel';
import ClerkPanel from './clerk-panel';
import Bench3D from './bench-arc';
import Lectern from './lectern';
import Bubble from './bubble';

interface PendingNoteContext
{
	message_id: string;
	message_text: string;
	speaker: string;
}

interface Props
{
	hearingId: string;
	side: 'plaintiff' | 'defendant';
	matchId?: string;
	initialJudges?: UIJudge[];
	userId?: string | null;
}

type Panel = 'hints' | 'stress' | 'clerk' | 'notes';

const JUSTICE_IDS = new Set(JUDGES.map(j => j.id));
const TRANSCRIPT_LIMIT = 8;
const TYPEWRITER_MS = 22;

const toUIJudge = (j: typeof JUDGES[0]): UIJudge => ({
	id: j.id,
	name: j.name,
	short: j.short,
	philosophy: j.philosophy,
	image: j.image,
});

export default function HearingRoom({ hearingId, side, matchId, initialJudges, userId }: Props)
{
	const case_ = useCase();
	const router = useRouter();

	const [messages, setMessages] = useState<HearingMessage[]>([]);
	const [phase, setPhase] = useState('interrogation_user');
	const [turn, setTurn] = useState(1);
	const [totalTurns, setTotalTurns] = useState(4);
	const [loading, setLoading] = useState(false);
	const [initialized, setInitialized] = useState(false);
	const [courtCalled, setCourtCalled] = useState(false);
	const [draft, setDraft] = useState('');
	const [openPanel, setOpenPanel] = useState<Panel | null>(null);
	const [judges, setJudges] = useState<UIJudge[]>(initialJudges ?? JUDGES.map(toUIJudge));
	const [displayedQuestion, setDisplayedQuestion] = useState('');
	const [isAnimating, setIsAnimating] = useState(false);
	const [pendingNoteContext, setPendingNoteContext] = useState<PendingNoteContext | null>(null);

	const onAddNote = useCallback((messageId: string, messageText: string, speaker: string) =>
	{
		setPendingNoteContext({ message_id: messageId, message_text: messageText, speaker });
		setOpenPanel('notes');
	}, []);

	const animIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const transcriptEndRef = useRef<HTMLDivElement>(null);

	useEffect(() =>
	{
		const stored = sessionStorage.getItem(`hearing_${hearingId}`);
		if(stored)
		{
			const data = JSON.parse(stored);
			const storedMsgs: HearingMessage[] = data.messages ?? [];
			setMessages(storedMsgs);
			setPhase(data.phase ?? 'interrogation_user');
			setTurn(data.turn ?? 1);
			setTotalTurns(data.total_turns ?? 4);

			if(data.judges && Array.isArray(data.judges))
				setJudges(data.judges);

			const lastQ = [...storedMsgs].reverse().find(
				m => (JUSTICE_IDS.has(m.speaker_id) || m.speaker_id === 'court') && m.type === 'question'
			);
			if(lastQ)
				setDisplayedQuestion(lastQ.content);
		}
		setInitialized(true);
	}, [hearingId]);

	const startTypewriter = useCallback((text: string) =>
	{
		if(animIntervalRef.current) clearInterval(animIntervalRef.current);

		setDisplayedQuestion('');
		setIsAnimating(true);

		let index = 0;
		animIntervalRef.current = setInterval(() =>
		{
			index++;
			setDisplayedQuestion(text.slice(0, index));

			if(index >= text.length)
			{
				clearInterval(animIntervalRef.current!);
				animIntervalRef.current = null;
				setIsAnimating(false);
			}
		}, TYPEWRITER_MS);
	}, []);

	useEffect(() =>
	{
		return () =>
		{
			if(animIntervalRef.current) clearInterval(animIntervalRef.current);
		};
	}, []);

	const handleSubmit = useCallback(async () =>
	{
		if(!draft.trim() || loading || isAnimating) return;

		const response = draft.trim();
		setDraft('');

		const userMsg: HearingMessage = {
			id: `temp-${Date.now()}`,
			speaker: 'You',
			speaker_id: 'user',
			content: response,
			type: 'statement',
		};

		setMessages(prev => [...prev, userMsg]);
		setLoading(true);
		setDisplayedQuestion('');

		try
		{
			const res = await fetch(`${API_URL}/hearing/turn`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ hearing_id: hearingId, user_response: response }),
			});

			if(!res.ok) throw new Error('Failed to submit response');

			const data = await res.json();

			const newMsgs: HearingMessage[] = data.messages ?? [];

			setMessages(prev =>
			{
				const filtered = prev.filter(m => !m.id.startsWith('temp-'));
				const updatedMsgs = [...filtered, ...newMsgs];
				sessionStorage.setItem(`hearing_${hearingId}`, JSON.stringify({
					messages: updatedMsgs,
					phase: data.phase,
					turn: data.turn ?? turn,
					total_turns: totalTurns,
					ruling: data.ruling,
					judges,
				}));
				return updatedMsgs;
			});

			setPhase(data.phase);
			setTurn(data.turn ?? turn);

			if(data.ruling)
			{
				const dest = matchId
					? `/match/${matchId}/results`
					: `/cases/${case_.id}/hearing/results?hearing_id=${hearingId}&side=${side}`;
				router.push(dest);
				return;
			}

			const newQuestion = [...newMsgs].reverse().find(
				m => (JUSTICE_IDS.has(m.speaker_id) || m.speaker_id === 'court') && m.type === 'question'
			);

			if(newQuestion)
			{
				setLoading(false);
				startTypewriter(newQuestion.content);
			}
			else
			{
				setLoading(false);
			}
		}
		catch
		{
			setLoading(false);
		}
	}, [draft, loading, isAnimating, hearingId, turn, totalTurns, judges, matchId, case_.id, side, router, startTypewriter]);

	useEffect(() =>
	{
		function onKeyDown(e: KeyboardEvent)
		{
			if(e.key === 'Escape')
			{
				setOpenPanel(null);
				return;
			}
			if(e.key === 'Enter' && (e.metaKey || e.ctrlKey))
				handleSubmit();
		}
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
	}, [handleSubmit]);

	useEffect(() =>
	{
		transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages, displayedQuestion]);

	if(!initialized)
	{
		return (
			<div className="flex flex-col gap-4 flex-1 p-8">
				<Skeleton className="h-36 w-full" />
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
				judges={judges}
			/>
		);
	}

	const lastJusticeMsg = [...messages].reverse().find(m => JUSTICE_IDS.has(m.speaker_id));
	const activeSpeakerId = lastJusticeMsg?.speaker_id ?? null;
	const spokenIds = new Set(messages.filter(m => JUSTICE_IDS.has(m.speaker_id)).map(m => m.speaker_id));

	const lastQuestion = [...messages].reverse().find(
		m => (JUSTICE_IDS.has(m.speaker_id) || m.speaker_id === 'court') && m.type === 'question'
	);
	const currentSpeaker = lastQuestion?.speaker ?? null;
	const currentSpeakerId = lastQuestion?.speaker_id ?? null;
	const currentType = lastQuestion?.type;

	const pendingQuestion = lastQuestion
		? { id: lastQuestion.id, speaker: lastQuestion.speaker, content: lastQuestion.content }
		: null;

	const pastMessages = messages.slice(-TRANSCRIPT_LIMIT).filter(
		m => m.id !== lastQuestion?.id
	);

	const lecternVisible = !isAnimating && !loading;

	return (
		<div className="flex h-full w-full overflow-hidden">
			<div className="flex-1 flex flex-col min-w-0">
				<Bench3D
					judges={judges}
					activeSpeakerId={activeSpeakerId}
					spokenIds={spokenIds}
					loading={loading}
				/>

				<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
					<div className="flex-1 overflow-y-auto px-6 pt-4 pb-2">
						<div className="max-w-2xl mx-auto flex flex-col gap-1">
							{pastMessages.map(m => (
								<Bubble key={m.id} message={m} onAddNote={userId ? onAddNote : undefined} />
							))}
							<div ref={transcriptEndRef} />
						</div>
					</div>

					<div className="px-6 py-4 shrink-0">
						<QuestionCard
							displayedQuestion={displayedQuestion}
							speaker={currentSpeaker}
							speakerId={currentSpeakerId}
							isAnimating={isAnimating}
							phase={phase}
							loading={loading && !displayedQuestion}
							type={currentType}
						/>
					</div>
				</div>

				<div
					className={`shrink-0 transition-all duration-500 ${
						lecternVisible
							? 'translate-y-0 opacity-100 lectern-visible'
							: 'translate-y-4 opacity-0 pointer-events-none'
					}`}
				>
					<Lectern
						draft={draft}
						onDraftChange={setDraft}
						onSubmit={handleSubmit}
						onStressTest={() => setOpenPanel('stress')}
						onClerk={() => setOpenPanel('clerk')}
						onNotes={userId ? () => setOpenPanel('notes') : undefined}
						loading={loading}
						phase={phase}
						visible={lecternVisible}
					/>
				</div>
			</div>

			<div
				className={`overflow-hidden transition-all duration-300 ease-in-out border-l border-border shrink-0 ${
					openPanel ? 'w-80' : 'w-0'
				}`}
			>
				{openPanel === 'notes' && (
					<NotesPanel
						hearingId={hearingId}
						caseId={case_.id}
						onClose={() => setOpenPanel(null)}
						pendingContext={pendingNoteContext}
						onClearPending={() => setPendingNoteContext(null)}
					/>
				)}
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
