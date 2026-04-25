'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import ResearchPanel from "./research-panel";
import AiPanel from "./ai-panel";
import { marked } from "marked";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface Case
{
	id: string;
	name: string;
	year: number;
	category: string;
	summary: string;
	citation: string;
}

interface Props
{
	case_: Case;
	initialDraft: string | null;
	side: "plaintiff" | "defendant";
}

interface ToolbarButtonProps
{
	onClick: () => void;
	active?: boolean;
	children: React.ReactNode;
}

function ToolbarButton({ onClick, active, children }: ToolbarButtonProps)
{
	return (
		<button
			type="button"
			onMouseDown={e =>
			{
				e.preventDefault();
				onClick();
			}}
			className={cn(
				"px-2.5 py-1 text-sm rounded transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
				active
					? "bg-foreground text-background"
					: "text-muted-foreground hover:bg-muted hover:text-foreground"
			)}
		>
			{children}
		</button>
	);
}

export default function Workspace({ case_, initialDraft, side }: Props)
{
	const [panelOpen, setPanelOpen] = useState(true);
	const [saving, setSaving] = useState(false);
	const [savedAt, setSavedAt] = useState<string | null>(null);

	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit,
			Placeholder.configure({ placeholder: "Your Honor, I respectfully submit that..." }),
		],
		editorProps: {
			attributes: { class: "tiptap-editor" },
		},
	});

	useEffect(() =>
	{
		if(editor && initialDraft && editor.isEmpty)
			editor.commands.setContent(marked.parse(initialDraft) as string);
	}, [editor, initialDraft]);

	async function handleSaveDraft()
	{
		if(!editor || editor.isEmpty) return;
		setSaving(true);
		try
		{
			await fetch(`${API_URL}/brief/save-draft`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ case_id: case_.id, content: editor.getText() }),
			});
			setSavedAt(new Date().toLocaleTimeString());
		}
		finally
		{
			setSaving(false);
		}
	}

	async function handleSubmit()
	{
		if(!editor || editor.isEmpty) return;
		// TODO: POST to /hearing/start
		alert("Brief submitted — judge deliberation coming soon.");
	}

	return (
		<div className="flex gap-6">
			<div className="flex-1 min-w-0 flex flex-col gap-4">
				<div className="rounded-xl border border-border overflow-hidden">
					<div className="flex items-center gap-1 px-3 py-2 border-b border-border bg-muted/30">
						<ToolbarButton
							onClick={() => editor?.chain().focus().toggleBold().run()}
							active={editor?.isActive("bold")}
						>
							<strong>B</strong>
						</ToolbarButton>
						<ToolbarButton
							onClick={() => editor?.chain().focus().toggleItalic().run()}
							active={editor?.isActive("italic")}
						>
							<em>I</em>
						</ToolbarButton>
						<ToolbarButton
							onClick={() => editor?.chain().focus().toggleUnderline().run()}
							active={editor?.isActive("underline")}
						>
							<span className="underline">U</span>
						</ToolbarButton>
						<div className="w-px h-4 bg-border mx-1" />
						<ToolbarButton
							onClick={() => editor?.chain().focus().toggleBulletList().run()}
							active={editor?.isActive("bulletList")}
						>
							• List
						</ToolbarButton>
						<ToolbarButton
							onClick={() => editor?.chain().focus().toggleOrderedList().run()}
							active={editor?.isActive("orderedList")}
						>
							1. List
						</ToolbarButton>

						<div className="ml-auto flex items-center gap-2">
							{savedAt && (
								<span className="text-xs text-muted-foreground">Saved {savedAt}</span>
							)}
							<button
								type="button"
								onClick={() => setPanelOpen(v => !v)}
								className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								title={panelOpen ? "Hide panel" : "Show panel"}
							>
								{panelOpen
									? <PanelRightClose size={16} />
									: <PanelRightOpen size={16} />
								}
							</button>
						</div>
					</div>

					<EditorContent editor={editor} className="tiptap-editor" />
				</div>

				<div className="flex items-center justify-between">
					<Button variant="outline" onClick={handleSaveDraft} disabled={saving || !editor || editor.isEmpty}>
						{saving ? "Saving..." : "Save draft"}
					</Button>
					<Button onClick={handleSubmit} disabled={!editor || editor.isEmpty}>
						Submit to the Court
					</Button>
				</div>
			</div>

			<div className={cn(
				"overflow-hidden transition-all duration-300 ease-in-out shrink-0",
				panelOpen ? "w-[400px]" : "w-0"
			)}>
				<div className="w-[400px]">
					<Card className="h-full">
						<CardContent className="pt-4">
							<Tabs defaultValue="research">
								<TabsList className="w-full">
									<TabsTrigger value="research" className="flex-1">Research</TabsTrigger>
									<TabsTrigger value="ai" className="flex-1">AI Assistant</TabsTrigger>
								</TabsList>
								<TabsContent value="research" className="mt-4">
									<ResearchPanel caseId={case_.id} caseName={case_.name} />
								</TabsContent>
								<TabsContent value="ai" className="mt-4">
									<AiPanel case_={case_} editor={editor} side={side} />
								</TabsContent>
							</Tabs>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
