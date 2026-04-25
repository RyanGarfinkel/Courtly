import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import Workspace from "./workspace";

interface Case
{
	id: string;
	name: string;
	year: number;
	category: string;
	summary: string;
	citation: string;
}

const BACKEND = process.env.API_URL ?? "http://localhost:8000";

async function getCase(id: string): Promise<Case | null>
{
	try
	{
		const res = await fetch(`${BACKEND}/cases/${id}`, { cache: "no-store" });
		if(!res.ok) return null;
		return await res.json();
	}
	catch
	{
		return null;
	}
}

async function getExistingDraft(caseId: string): Promise<string | null>
{
	try
	{
		const res = await fetch(`${BACKEND}/brief/load-draft?case_id=${encodeURIComponent(caseId)}`, { cache: "no-store" });
		if(!res.ok) return null;
		return (await res.json()).draft ?? null;
	}
	catch
	{
		return null;
	}
}

type Side = "plaintiff" | "defendant";

type Props = {
	params: Promise<{ id: string }>;
	searchParams?: Promise<{ side?: string }>;
};

export default async function BriefPage({ params, searchParams }: Props)
{
	const [{ id }, sp] = await Promise.all([params, searchParams ?? Promise.resolve({} as { side?: string })]);
	const side: Side = sp.side === "defendant" ? "defendant" : "plaintiff";
	const [c, initialDraft] = await Promise.all([getCase(id), getExistingDraft(id)]);
	if(!c) notFound();

	return (
		<main className="flex-1 px-8 py-10">
			<div className="max-w-7xl mx-auto">
				<Breadcrumb className="mb-8">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/dashboard">Cases</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href={`/dashboard/cases/${c.id}`}>{c.name}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Brief</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="mb-6">
					<div className="flex items-center gap-3 mb-2">
						<Badge variant="secondary">{c.category}</Badge>
						<span className="text-xs text-muted-foreground">{c.year}</span>
						<span className="text-xs text-muted-foreground">{c.citation}</span>
					</div>
					<div className="flex items-center gap-3">
						<h1 className="text-2xl font-bold">{c.name}</h1>
						<Badge variant={side === "plaintiff" ? "default" : "secondary"}>
							{side === "plaintiff" ? "Plaintiff" : "Defense"}
						</Badge>
					</div>
				</div>

				<Workspace case_={c} initialDraft={initialDraft} side={side} />
			</div>
		</main>
	);
}
