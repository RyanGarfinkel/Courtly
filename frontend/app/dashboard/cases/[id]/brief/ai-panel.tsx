'use client';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { Editor } from "@tiptap/react";
import { marked } from "marked";
import { useState } from "react";

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
	editor: Editor | null;
	side: "plaintiff" | "defendant";
}

type Action = "draft" | "expand" | "strengthen" | "counter";

const ACTIONS: { id: Action; label: string; description: string }[] = [
	{
		id: "draft",
		label: "Draft for me",
		description: "Generate a complete brief from the case details.",
	},
	{
		id: "expand",
		label: "Expand my notes",
		description: "Turn bullet points or rough notes into formal paragraphs.",
	},
	{
		id: "strengthen",
		label: "Strengthen argument",
		description: "Sharpen your existing text with tighter reasoning.",
	},
	{
		id: "counter",
		label: "Anticipate counterarguments",
		description: "See what the other side or skeptical justices might argue.",
	},
];

export default function AiPanel({ case_, editor, side }: Props)
{
	const [notes, setNotes] = useState("");
	const [activeAction, setActiveAction] = useState<Action | null>(null);
	const [preview, setPreview] = useState<{ action: Action; result: string } | null>(null);

	async function runAction(action: Action)
	{
		setActiveAction(action);
		setPreview(null);

		const currentText = editor?.getText() ?? "";

		const endpointMap: Record<Action, string> = {
			draft: "/brief/draft",
			expand: "/brief/expand",
			strengthen: "/brief/strengthen",
			counter: "/brief/counter",
		};

		const bodyMap: Record<Action, object> = {
			draft: {
				case_name: case_.name,
				case_summary: case_.summary,
				category: case_.category,
				year: case_.year,
				citation: case_.citation,
				user_notes: notes || currentText,
			},
			expand: {
				content: notes || currentText,
				case_name: case_.name,
				case_summary: case_.summary,
			},
			strengthen: {
				content: currentText,
				case_name: case_.name,
			},
			counter: {
				content: currentText,
				case_name: case_.name,
			},
		};

		try
		{
			const res = await fetch(`${API_URL}${endpointMap[action]}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(bodyMap[action]),
			});
			const data = await res.json();
			if(!res.ok)
			{
				console.error("AI action failed:", JSON.stringify(data, null, 2));
				setPreview({ action, result: `Error: ${res.status} — ${JSON.stringify(data.detail ?? data)}` });
				return;
			}
			setPreview({ action, result: data.result });
		}
		catch
		{
			setPreview({ action, result: "Failed to reach the backend. Make sure the server is running." });
		}
		finally
		{
			setActiveAction(null);
		}
	}

	function applyToEditor()
	{
		if(!preview || !editor) return;
		editor.commands.setContent(marked.parse(preview.result) as string);
		setPreview(null);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Notes or context</label>
				<Textarea
					value={notes}
					onChange={e => setNotes(e.target.value)}
					rows={4}
					placeholder="Add bullets, a position, or any notes to guide the AI..."
				/>
			</div>

			<div className="flex flex-col gap-2">
				<label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Actions</label>
				{ACTIONS.map(action => (
					<button
						key={action.id}
						onClick={() => runAction(action.id)}
						disabled={activeAction !== null}
						className="flex flex-col items-start gap-0.5 rounded-lg border border-border px-4 py-3 text-left hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
					>
						<span className="text-sm font-medium">
							{activeAction === action.id ? "Working..." : action.label}
						</span>
						<span className="text-xs text-muted-foreground">{action.description}</span>
					</button>
				))}
			</div>

			{preview && (
				<div className="flex flex-col gap-3 rounded-lg border border-border p-4 bg-muted/30">
					<div className="flex items-center justify-between">
						<span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Preview</span>
						<button
							onClick={() => setPreview(null)}
							className="text-xs text-muted-foreground hover:text-foreground focus-visible:outline-none"
						>
							Dismiss
						</button>
					</div>
					<div
						className="text-sm leading-relaxed prose prose-sm max-w-none"
						dangerouslySetInnerHTML={{ __html: marked.parse(preview.result) as string }}
					/>
					{preview.action !== "counter" && (
						<Button size="sm" onClick={applyToEditor}>Apply to editor</Button>
					)}
				</div>
			)}
		</div>
	);
}
