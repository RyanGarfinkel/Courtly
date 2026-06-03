'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import ResearchPanel from './research-panel';
import AiPanel from './ai-panel';
import { marked } from 'marked';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCase } from '@/contexts/case';
import { API_URL } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Props
{
	initialDraft: string | null;
	side: 'plaintiff' | 'defendant';
	matchId?: string;
}

interface ToolbarButtonProps
{
	onClick: () => void;
	active?: boolean;
	children: React.ReactNode;
}

const ToolbarButton = ({ onClick, active, children }: ToolbarButtonProps) =>
{
	return (
		<button
			type='button'
			onMouseDown={e =>
			{
				e.preventDefault();
				onClick();
			}}
			className={cn(
				'px-2.5 py-1 text-sm rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
				active
					? 'bg-foreground text-background'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground'
			)}
		>
			{children}
		</button>
	);
};

const Workspace = ({ initialDraft, side, matchId }: Props) =>
{
	const c = useCase();
	const [panelOpen, setPanelOpen] = useState(true);
	const [saving, setSaving] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [editorEmpty, setEditorEmpty] = useState(true);
	const [savedAt, setSavedAt] = useState<string | null>(null);
	const router = useRouter();

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit,
			Placeholder.configure({ placeholder: 'Your Honor, I respectfully submit that...' }),
		],
		editorProps: {
			attributes: { class: 'tiptap-editor' },
		},
		onUpdate: ({ editor: e }) => setEditorEmpty(e.isEmpty),
	});

	useEffect(() =>
	{
		if(editor && initialDraft && editor.isEmpty)
		{
			editor.commands.setContent(marked.parse(initialDraft) as string);
			setEditorEmpty(false);
		}
	}, [editor, initialDraft]);

	const handleSaveDraft = async () =>
	{
		if(!editor || editorEmpty) return;
		setSaving(true);
		try
		{
			await fetch(`${API_URL}/brief/save-draft`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ case_id: c.id, content: editor.getText() }),
			});
			setSavedAt(new Date().toLocaleTimeString());
		}
		finally
		{
			setSaving(false);
		}
	};

	const handleSubmit = async () =>
	{
		if(!editor || editorEmpty) return;
		setSubmitting(true);
		try
		{
			const res = await fetch(`${API_URL}/hearing/start`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					case_id: c.id,
					case_name: c.name,
					case_summary: c.summary,
					brief: editor.getText(),
					side,
					...(matchId ? { match_id: matchId } : {}),
				}),
			});
			const data = await res.json();
			sessionStorage.setItem(`hearing_${data.hearing_id}`, JSON.stringify(data));
			const matchParam = matchId ? `&match_id=${matchId}` : '';
			router.push(`/cases/${c.id}/hearing?hearing_id=${data.hearing_id}&side=${side}${matchParam}`);
		}
		finally
		{
			setSubmitting(false);
		}
	};

	return (
		<div className='flex gap-6'>
			<div className='flex-1 min-w-0 flex flex-col gap-4'>
				<div className='flex items-center justify-between mb-1'>
					<p className='label-caps text-muted-foreground'>Your Brief</p>
					<button
						type='button'
						onClick={handleSubmit}
						disabled={!editor || editorEmpty || submitting}
						className='inline-flex items-center justify-center rounded-sm bg-primary text-primary-foreground px-5 py-2 text-sm font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity disabled:opacity-40 disabled:cursor-not-allowed'
					>
						{submitting ? 'Submitting...' : 'Enter the Courtroom →'}
					</button>
				</div>

				<div className='rounded-sm border border-border overflow-hidden'>
					<div className='flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/20'>
						<ToolbarButton
							onClick={() => editor?.chain().focus().toggleBold().run()}
							active={editor?.isActive('bold')}
						>
							<strong>B</strong>
						</ToolbarButton>
						<ToolbarButton
							onClick={() => editor?.chain().focus().toggleItalic().run()}
							active={editor?.isActive('italic')}
						>
							<em>I</em>
						</ToolbarButton>
						<ToolbarButton
							onClick={() => editor?.chain().focus().toggleUnderline?.().run()}
							active={editor?.isActive('underline')}
						>
							<span className='underline'>U</span>
						</ToolbarButton>
						<div className='w-px h-4 bg-border mx-1' />
						<ToolbarButton
							onClick={() => editor?.chain().focus().toggleBulletList().run()}
							active={editor?.isActive('bulletList')}
						>
							• List
						</ToolbarButton>
						<ToolbarButton
							onClick={() => editor?.chain().focus().toggleOrderedList().run()}
							active={editor?.isActive('orderedList')}
						>
							1. List
						</ToolbarButton>

						<div className='ml-auto flex items-center gap-3'>
							{savedAt && (
								<span className='text-xs text-muted-foreground'>Saved {savedAt}</span>
							)}
							<button
								type='button'
								onClick={() => setPanelOpen(v => !v)}
								className='p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
								title={panelOpen ? 'Hide panel' : 'Show panel'}
							>
								{panelOpen
									? <PanelRightClose size={16} />
									: <PanelRightOpen size={16} />
								}
							</button>
						</div>
					</div>

					<EditorContent editor={editor} className='tiptap-editor' />
				</div>

				<div className='flex items-center justify-between'>
					<button
						type='button'
						onClick={handleSaveDraft}
						disabled={saving || !editor || editorEmpty}
						className='inline-flex items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors disabled:opacity-40 disabled:cursor-not-allowed'
					>
						{saving ? 'Saving...' : 'Save draft'}
					</button>
				</div>
			</div>

			<div className={cn(
				'overflow-hidden transition-all duration-300 ease-in-out shrink-0',
				panelOpen ? 'w-[380px]' : 'w-0'
			)}>
				<div className='w-[380px]'>
					<div className='border border-border rounded-sm overflow-hidden'>
						<div className='px-4 pt-4 pb-0'>
							<Tabs defaultValue='research'>
								<TabsList className='w-full bg-muted/30 rounded-sm'>
									<TabsTrigger value='research' className='flex-1 rounded-sm text-xs'>Research</TabsTrigger>
									<TabsTrigger value='ai' className='flex-1 rounded-sm text-xs'>AI Assistant</TabsTrigger>
								</TabsList>
								<TabsContent value='research' className='mt-4'>
									<ResearchPanel caseId={c.id} caseName={c.name} caseYear={c.year} />
								</TabsContent>
								<TabsContent value='ai' className='mt-4'>
									<AiPanel editor={editor} side={side} />
								</TabsContent>
							</Tabs>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Workspace;
