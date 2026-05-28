import { getNotesByHearing } from '@/lib/services/notes';
import { getRecordByHearingId } from '@/lib/services/recordStore';
import { HearingMessage } from '@/types/hearing';
import { HearingRecord } from '@/types/record';
import { auth0 } from '@/lib/auth0';
import { notFound } from 'next/navigation';
import ShareButton from './share-button';
import { Note } from '@/types/notes';

type Props = {
	params: Promise<{ hearingId: string }>;
};

const ScoreBar = ({ label, value }: { label: string; value: number }) =>
{
	return (
		<div className='flex flex-col gap-1.5'>
			<div className='flex justify-between text-xs'>
				<span className='text-muted-foreground'>{label}</span>
				<span className='font-medium tabular-nums'>{Math.round(value)}</span>
			</div>
			<div className='h-1 bg-muted overflow-hidden'>
				<div
					className='h-full bg-foreground/50'
					style={{ width: `${value}%` }}
				/>
			</div>
		</div>
	);
};

const MessageLine = ({ msg }: { msg: HearingMessage }) =>
{
	if(msg.type === 'aside')
	{
		return (
			<div className='pl-8 py-2'>
				<p className='text-xs text-muted-foreground/60 italic'>
					[{msg.speaker} — aside]
				</p>
				<p className='text-xs text-muted-foreground/70 italic pl-2 leading-relaxed'>{msg.content}</p>
			</div>
		);
	}

	if(msg.type === 'press' || msg.speaker_id === 'court')
	{
		return (
			<div className='py-3 text-center'>
				<p className='text-xs text-muted-foreground italic'>{msg.content}</p>
			</div>
		);
	}

	const isUser = msg.speaker_id === 'user';

	return (
		<div className={`flex flex-col gap-1 py-3 ${isUser ? 'border-l-2 border-primary/30 pl-4' : 'pl-1'}`}>
			<span className='label-caps text-muted-foreground'>
				{msg.speaker}
			</span>
			<p className={`text-sm leading-relaxed ${isUser ? 'text-foreground' : 'text-foreground/80'}`}
				style={isUser ? {} : { fontFamily: 'var(--font-sans)' }}
			>
				{msg.content}
			</p>
		</div>
	);
};

const NoteCard = ({ note }: { note: Note }) => (
	<div className='flex flex-col gap-1 border border-border rounded-sm p-3'>
		{note.speaker && (
			<p className='text-[10px] text-muted-foreground/60 truncate'>
				{note.speaker}
				{note.message_text && (
					<span className='italic'> — "{note.message_text.slice(0, 60)}{note.message_text.length > 60 ? '…' : ''}"</span>
				)}
			</p>
		)}
		<p className='text-sm text-foreground leading-relaxed'>{note.note_text}</p>
	</div>
);

const TranscriptPage = async ({ params }: Props) =>
{
	const { hearingId } = await params;
	const session = await auth0.getSession();
	const userId = session?.user?.sub ?? null;

	const [record, notes] = await Promise.all([
		getRecordByHearingId(hearingId),
		userId ? getNotesByHearing(userId, hearingId) : Promise.resolve([] as Note[]),
	]);
	if(!record) notFound();

	const won = record.result === 'affirmed';
	const sideLabel = record.side === 'plaintiff' ? 'Petitioner' : 'Respondent';
	const resultLabel = won ? 'AFFIRMED' : 'REVERSED';
	const voteLabel = `${record.vote_for}–${record.vote_against}`;

	const arguedDate = new Date(record.argued_at).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	const transcriptMessages = record.messages;

	return (
		<main className='px-6 py-12'>
			<div className='max-w-3xl mx-auto flex flex-col gap-10'>

				<div className='text-center flex flex-col gap-3'>
					<p className='label-caps text-muted-foreground'>
						Supreme Court of the United States
					</p>
					<div className='w-16 h-px bg-border mx-auto' />
					<h1 className='font-heading text-3xl font-bold leading-tight text-foreground'>
						{record.case_name}
					</h1>
					{record.case_year && (
						<p className='text-sm text-muted-foreground'>{record.case_year}</p>
					)}
					<p className='text-xs text-muted-foreground italic'>Official Transcript</p>
					<div className='flex items-center justify-center gap-2 flex-wrap mt-1'>
						<span className='text-sm text-muted-foreground'>{sideLabel}</span>
						<span className='text-muted-foreground/30'>·</span>
						<span className={`text-sm font-semibold tracking-wide ${won ? 'text-green-600' : 'text-red-500'}`}>
							{resultLabel}
						</span>
						<span className='text-muted-foreground/30'>·</span>
						<span className='text-sm text-muted-foreground'>{voteLabel}</span>
						<span className='text-muted-foreground/30'>·</span>
						<span className='text-sm text-muted-foreground'>{arguedDate}</span>
					</div>
					<div className='flex justify-center mt-1'>
						<ShareButton />
					</div>
				</div>

				<div className='border border-border rounded-sm p-5 flex flex-col gap-3'>
					<p className='label-caps text-muted-foreground mb-1'>
						Performance Scores
					</p>
					<ScoreBar label='Consistency' value={record.scores.consistency} />
					<ScoreBar label='Precedent' value={record.scores.precedent} />
					<ScoreBar label='Responsiveness' value={record.scores.responsiveness} />
					<div className='border-t border-border pt-3 mt-1'>
						<ScoreBar label='Overall' value={record.scores.overall} />
					</div>
					{record.swing_justices.length > 0 && (
						<p className='text-xs text-muted-foreground mt-1'>
							Swing justices: {record.swing_justices.join(', ')}
						</p>
					)}
				</div>

				<div className='flex flex-col gap-2'>
					<p className='label-caps text-muted-foreground mb-3'>
						Oral Argument Transcript
					</p>
					<div className='border border-border rounded-sm overflow-hidden'>
						<div className='flex flex-col divide-y divide-border px-4'>
							{transcriptMessages.map(msg => (
								<MessageLine key={msg.id} msg={msg} />
							))}
						</div>
					</div>
				</div>


				{notes.length > 0 && (
					<div className='flex flex-col gap-3'>
						<p className='label-caps text-muted-foreground'>Your Notes</p>
						{notes.map(n => (
							<NoteCard key={n.note_id} note={n} />
						))}
					</div>
				)}

				<div className='flex justify-center pt-4 border-t border-border'>
					<a
						href='/dashboard'
						className='text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded'
					>
						Back to Dashboard
					</a>
				</div>
			</div>
		</main>
	);
};

export default TranscriptPage;
