import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { getLatestDraft } from "@/lib/services/caseMemory";
import { notFound } from "next/navigation";
import { CaseProvider } from "@/contexts/case";
import { Badge } from "@/components/ui/badge";
import { Case } from "@/types/case";
import { getDb } from "@/lib/mongo";
import Workspace from "./workspace";

async function getCase(id: string): Promise<Case | null>
{
	try
	{
		const db = await getDb();
		const doc = await db.collection('cases').findOne({ id }, { projection: { _id: 0 } });
		return doc ? doc as unknown as Case : null;
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
	const [c, initialDraft] = await Promise.all([getCase(id), getLatestDraft(id)]);
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
							<BreadcrumbLink href={`/cases/${c.id}`}>{c.name}</BreadcrumbLink>
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

				<CaseProvider case_={c}>
					<Workspace initialDraft={initialDraft} side={side} />
				</CaseProvider>
			</div>
		</main>
	);
}
