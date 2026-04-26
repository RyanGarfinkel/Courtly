'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

const PRESETS = [
	{ label: 'What just happened?', question: '' },
	{ label: 'Where am I weak?', question: "What are the weakest parts of my argument based on what I've said so far?" },
	{ label: 'Key precedents?', question: 'What are the most relevant precedents I should be citing in this argument?' },
];

interface Memo
{
	label: string;
	body: string;
	isAuto?: boolean;
}

interface Props
{
	hearingId: string;
	pendingQuestion: { id: string; speaker: string; content: string } | null;
}

export default function AssistantPanel({ hearingId, pendingQuestion }: Props)
{
	const [memos, setMemos] = useState<Memo[]>([]);
	const [custom, setCustom] = useState('');
	const [loading, setLoading] = useState(false);
	const [activePreset, setActivePreset] = useState<string | null>(null);
	const processedQuestions = useRef(new Set<string>());

	async function callAssist(question: string, label: string, isAuto = false)
	{
		setLoading(true);
		if(!isAuto) setActivePreset(label);
		try
		{
			const res = await fetch(`${API_URL}/hearing/assist`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ hearing_id: hearingId, question }),
			});
			const data = await res.json();
			setMemos(prev => [{ label, body: data.answer, isAuto }, ...prev]);
		}
		finally
		{
			setLoading(false);
			setActivePreset(null);
		}
	}

	useEffect(() =>
	{
		if (pendingQuestion && !processedQuestions.current.has(pendingQuestion.id))
		{
			processedQuestions.current.add(pendingQuestion.id);
			callAssist(
				`Summarize what ${pendingQuestion.speaker} just asked in simple, plain English. Keep it to 2-3 sentences max.`,
				`${pendingQuestion.speaker}'s Question`,
				true
			);
		}
	}, [pendingQuestion]);

	function handleCustomSubmit()
	{
		if(!custom.trim() || loading) return;
		callAssist(custom.trim(), custom.trim());
		setCustom('');
	}

	return (
		<div className="flex flex-col gap-5 h-full">
			<div className="flex flex-col gap-1.5">
				<p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Law Clerk</p>
				<div className="flex flex-wrap gap-1.5">
					{PRESETS.map(p => (
						<button
							key={p.label}
							onClick={() => callAssist(p.question, p.label)}
							disabled={loading}
							className={cn(
								'px-2.5 py-1 rounded-full border text-[11px] font-medium transition-colors',
								activePreset === p.label
									? 'bg-foreground text-background border-foreground'
									: 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40',
								'disabled:opacity-40 disabled:cursor-not-allowed',
							)}
						>
							{loading && activePreset === p.label ? 'Consulting...' : p.label}
						</button>
					))}
				</div>
			</div>

			<div className="flex gap-2 items-center border border-border rounded-md px-3 py-2 focus-within:border-foreground/40 transition-colors">
				<input
					type="text"
					placeholder="Ask the clerk anything..."
					value={custom}
					onChange={e => setCustom(e.target.value)}
					onKeyDown={e => e.key === 'Enter' && handleCustomSubmit()}
					disabled={loading}
					className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground disabled:opacity-40"
				/>
				<button
					onClick={handleCustomSubmit}
					disabled={!custom.trim() || loading}
					className="text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
				>
					Ask ↵
				</button>
			</div>

			<div className="flex flex-col gap-3 flex-1 overflow-y-auto">
				{loading && (
					<div className="flex flex-col gap-2 p-4 rounded-lg border border-border bg-muted/20">
						<div className="flex items-center gap-2 mb-1">
							<div className="h-px flex-1 bg-foreground/20" />
							<span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">Clerk's Memo</span>
							<div className="h-px flex-1 bg-foreground/20" />
						</div>
						<Skeleton className="h-2.5 w-3/4" />
						<Skeleton className="h-2.5 w-full" />
						<Skeleton className="h-2.5 w-5/6" />
						<Skeleton className="h-2.5 w-2/3" />
					</div>
				)}

				{memos.map((memo, i) => (
					<div key={i} className={cn(
						"flex flex-col gap-3 p-4 rounded-lg border transition-colors",
						memo.isAuto ? "border-foreground/20 bg-foreground/[0.02]" : "border-border bg-muted/10"
					)}>
						<div className="flex items-center gap-2">
							<div className="h-px flex-1 bg-foreground/15" />
							<span className="text-[9px] font-medium text-muted-foreground uppercase tracking-widest">
								{memo.isAuto ? "Auto-Memo" : "Clerk's Memo"}
							</span>
							<div className="h-px flex-1 bg-foreground/15" />
						</div>
						{memo.label !== 'What just happened?' && (
							<p className="text-[10px] text-muted-foreground font-medium">Re: {memo.label}</p>
						)}
						<p className="text-xs text-foreground leading-relaxed">{memo.body}</p>
					</div>
				))}

				{memos.length === 0 && !loading && (
					<p className="text-xs text-muted-foreground text-center py-4">
						Select a query above or ask the clerk directly.
					</p>
				)}
			</div>
		</div>
	);
}
