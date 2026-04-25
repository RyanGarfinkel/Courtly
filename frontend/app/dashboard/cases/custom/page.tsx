'use client';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function CustomCasePage()
{
	const router = useRouter();
	const [name, setName] = useState("");
	const [summary, setSummary] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(e: React.FormEvent)
	{
		e.preventDefault();
		if(!name.trim() || !summary.trim()) return;

		setSubmitting(true);
		setError("");
		try
		{
			const res = await fetch(`${API_URL}/cases`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ name: name.trim(), summary: summary.trim() }),
			});
			if(!res.ok) throw new Error("Failed to create case");
			const newCase = await res.json();
			router.push(`/dashboard/cases/${newCase.id}`);
		}
		catch
		{
			setError("Something went wrong. Make sure the backend is running.");
			setSubmitting(false);
		}
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
					<p className="text-muted-foreground">Define a custom legal scenario to bring before the nine-justice panel.</p>
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
						<label htmlFor="summary" className="text-sm font-medium">Case summary</label>
						<p className="text-xs text-muted-foreground">
							Describe the facts and the legal question at issue. You'll write your argument on the next page.
						</p>
						<Textarea
							id="summary"
							value={summary}
							onChange={e => setSummary(e.target.value)}
							rows={6}
							placeholder="Describe what happened and what constitutional or legal question is at stake..."
						/>
					</div>

					{error && <p className="text-sm text-destructive">{error}</p>}

					<Button
						type="submit"
						disabled={submitting || !name.trim() || !summary.trim()}
						className="self-end"
					>
						{submitting ? "Creating..." : "Continue to brief →"}
					</Button>
				</form>
			</div>
		</main>
	);
}
