'use client';

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useCase } from "@/contexts/case";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ArgumentForm()
{
	const case_ = useCase();
	const [argument, setArgument] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [drafting, setDrafting] = useState(false);

	async function handleDraft()
	{
		setDrafting(true);
		try
		{
			const res = await fetch(`${API_URL}/brief/draft`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					case_name: case_.name,
					case_summary: case_.summary,
					category: case_.category,
					year: case_.year,
					citation: case_.citation,
					user_notes: argument,
				}),
			});
			const data = await res.json();
			setArgument(data.draft);
		}
		finally
		{
			setDrafting(false);
		}
	}

	async function handleSubmit(e: React.FormEvent)
	{
		e.preventDefault();
		if(!argument.trim()) return;

		setSubmitting(true);
		// TODO: POST to /hearing/start with { caseId, argument }
		await new Promise(r => setTimeout(r, 1500));
		setSubmitting(false);
		setSubmitted(true);
	}

	if(submitted)
	{
		return (
			<div className="rounded-lg border border-border p-6 text-center">
				<p className="text-muted-foreground text-sm mb-1">The Court has received your argument.</p>
				<p className="font-semibold">The justices are deliberating.</p>
				<p className="text-xs text-muted-foreground mt-4">Judge responses coming soon.</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<div className="flex flex-col gap-2">
				<div className="flex items-center justify-between">
					<label htmlFor="argument" className="text-sm font-medium">
						Present your argument to the Court
					</label>
					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={handleDraft}
						disabled={drafting}
					>
						{drafting ? "Drafting..." : "Draft with AI"}
					</Button>
				</div>
				<p className="text-xs text-muted-foreground">
					State your position and supporting reasoning. Add notes first to guide the AI draft.
				</p>
				<Textarea
					id="argument"
					value={argument}
					onChange={e => setArgument(e.target.value)}
					rows={10}
					placeholder="Your Honor, I respectfully submit that..."
				/>
			</div>

			<Button
				type="submit"
				disabled={submitting || !argument.trim()}
				className="self-end"
			>
				{submitting ? "Submitting..." : "Submit to the Court"}
			</Button>
		</form>
	);
}
