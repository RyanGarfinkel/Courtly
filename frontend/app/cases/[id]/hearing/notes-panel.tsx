'use client';

import { useEffect, useRef, useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Note } from '@/types/notes';

interface PendingContext
{
	message_id: string;
	message_text: string;
	speaker: string;
}

interface Props
{
	hearingId: string;
	caseId: string;
	onClose: () => void;
	pendingContext: PendingContext | null;
	onClearPending: () => void;
}

const TrashIcon = () => (
	<svg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
		<polyline points='3 6 5 6 21 6' />
		<path d='M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6' />
		<path d='M10 11v6M14 11v6' />
		<path d='M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2' />
	</svg>
);

const XIcon = () => (
	<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' aria-hidden='true'>
		<line x1='18' y1='6' x2='6' y2='18' /><line x1='6' y1='6' x2='18' y2='18' />
	</svg>
);

const NotesPanel = ({ hearingId, caseId, onClose, pendingContext, onClearPending }: Props) =>
{
	const [notes, setNotes] = useState<Note[]>([]);
	const [draft, setDraft] = useState('');
	const [saving, setSaving] = useState(false);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() =>
	{
		const load = async () =>
		{
			try
			{
				const res = await fetch(`/api/notes?hearing_id=${hearingId}`);
				if(!res.ok) return;
				const data = await res.json();
				setNotes(data.notes ?? []);
			}
			catch {}
		};
		load();
	}, [hearingId]);

	useEffect(() =>
	{
		if(pendingContext)
			textareaRef.current?.focus();
	}, [pendingContext]);

	const save = async () =>
	{
		if(!draft.trim() || saving) return;
		setSaving(true);

		try
		{
			const res = await fetch('/api/notes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					hearing_id: hearingId,
					case_id: caseId,
					message_id: pendingContext?.message_id ?? '',
					message_text: pendingContext?.message_text ?? '',
					speaker: pendingContext?.speaker ?? '',
					note_text: draft.trim(),
				}),
			});

			if(!res.ok) return;
			const data = await res.json();
			setNotes(prev => [...prev, data.note]);
			setDraft('');
			onClearPending();
		}
		catch {}
		finally
		{
			setSaving(false);
		}
	};

	const remove = async (noteId: string) =>
	{
		try
		{
			const res = await fetch(`/api/notes/${noteId}`, { method: 'DELETE' });
			if(!res.ok) return;
			setNotes(prev => prev.filter(n => n.note_id !== noteId));
		}
		catch {}
	};

	const onKeyDown = (e: React.KeyboardEvent) =>
	{
		if(e.key === 'Enter' && (e.metaKey || e.ctrlKey))
		{
			e.preventDefault();
			save();
		}
	};

	return (
		<div className='flex flex-col h-full bg-background'>
			<div className='flex items-center justify-between px-4 py-3 border-b border-border shrink-0'>
				<p className='label-caps text-muted-foreground'>Notes</p>
				<button
					type='button'
					onClick={onClose}
					className='text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded'
				>
					<XIcon />
				</button>
			</div>

			<div className='flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3 min-h-0'>
				{notes.length === 0 && (
					<p className='text-xs text-muted-foreground/60 italic pt-2'>
						No notes yet. Add one below.
					</p>
				)}
				{notes.map(note => (
					<div key={note.note_id} className='flex flex-col gap-1 border border-border rounded-sm p-3 group'>
						{note.speaker && (
							<p className='text-[10px] text-muted-foreground/60 truncate'>
								{note.speaker}
								{note.message_text && <span className='italic'> — "{note.message_text.slice(0, 60)}{note.message_text.length > 60 ? '…' : ''}"</span>}
							</p>
						)}
						<p className='text-xs text-foreground leading-relaxed'>{note.note_text}</p>
						<button
							type='button'
							onClick={() => remove(note.note_id)}
							className='self-end text-muted-foreground/40 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded mt-1'
						>
							<TrashIcon />
						</button>
					</div>
				))}
			</div>

			<div className='shrink-0 border-t border-border px-4 py-3 flex flex-col gap-2'>
				{pendingContext?.speaker && (
					<div className='flex items-center justify-between'>
						<p className='text-[10px] text-muted-foreground/60 italic truncate max-w-[200px]'>
							Re: {pendingContext.speaker}
						</p>
						<button
							type='button'
							onClick={onClearPending}
							className='text-[10px] text-muted-foreground/50 hover:text-foreground transition-colors focus-visible:outline-none'
						>
							clear
						</button>
					</div>
				)}
				<Textarea
					ref={textareaRef}
					value={draft}
					onChange={e => setDraft(e.target.value)}
					onKeyDown={onKeyDown}
					placeholder='Add a note…'
					rows={3}
					className='resize-none text-xs'
				/>
				<button
					type='button'
					onClick={save}
					disabled={!draft.trim() || saving}
					className='self-end text-xs font-medium text-primary hover:opacity-80 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded'
				>
					{saving ? 'Saving…' : 'Save note ⌘↵'}
				</button>
			</div>
		</div>
	);
};

export default NotesPanel;
