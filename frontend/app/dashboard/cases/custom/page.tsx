'use client';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function CustomCasePage()
{
	const [name, setName] = useState("");
	const [argument, setArgument] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [drafting, setDrafting] = useState(false);

	async function handleDraft()
	{
		if(!name.trim()) return;
		setDrafting(true);
		try
		{
			const res = await fetch(`${API_URL}/brief/draft`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					case_name: name,
					case_summary: argument || "Custom case submitted by the user.",
					category: "Custom",
					year: new Date().getFullYear(),
					citation: "N/A",
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
		if(!name.trim() || !argument.trim()) return;

		setSubmitting(true);
		// TODO: POST to /hearing/start with { caseId: "custom", caseName: name, argument }
		await new Promise(r => setTimeout(r, 1500));
		setSubmitting(false);
		setSubmitted(true);
	}

	if(submitted)
	{
		return (
			<main className="flex-1 px-8 py-10">
				<div className="max-w-3xl mx-auto rounded-lg border border-border p-6 text-center">
					<p className="text-muted-foreground text-sm mb-1">The Court has received your argument.</p>
					<p className="font-semibold">The justices are deliberating.</p>
					<p className="text-xs text-muted-foreground mt-4">Judge responses coming soon.</p>
				</div>
			</main>
		);
	}

	return (
		<main className="flex-1 px-8 py-10">
			<div className="max-w-3xl mx-auto">
				<Breadcrumb className="mb-8">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/dashboard">Cases</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Custom case</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="mb-8">
					<h1 className="text-2xl font-bold mb-2">Build your own case</h1>
					<p className="text-muted-foreground">Define a custom legal scenario and present it to the nine-justice panel.</p>
				</div>

				<form onSubmit={handleSubmit} className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<label htmlFor="name" className="text-sm font-medium">Case name</label>
						<Input
							id="name"
							value={name}
							onChange={e => setName(e.target.value)}
							placeholder="e.g. Smith v. State of New York"
						/>
					</div>

					<div className="flex flex-col gap-2">
						<div className="flex items-center justify-between">
							<label htmlFor="argument" className="text-sm font-medium">Present your argument</label>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={handleDraft}
								disabled={drafting || !name.trim()}
							>
								{drafting ? "Drafting..." : "Draft with AI"}
							</Button>
						</div>
						<p className="text-xs text-muted-foreground">
							Describe the facts, the legal question at issue, and your position.
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
						disabled={submitting || !name.trim() || !argument.trim()}
						className="self-end"
					>
						{submitting ? "Submitting..." : "Submit to the Court"}
					</Button>
				</form>
			</div>
		</main>
	);
}
