import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { searchOpinions } from "@/lib/courtlistener";
import { mapCl } from "@/lib/services/caseService";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Case } from "@/types/case";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Scale, Shield } from "lucide-react";
import { getDb } from "@/lib/mongo";
import Link from "next/link";
import { marked } from "marked";

async function getCase(id: string): Promise<Case | null>
{
	try
	{
		const db = await getDb();
		const cached = await db.collection('cases').findOne({ id }, { projection: { _id: 0 } });
		if(cached) return cached as unknown as Case;

		const results = await searchOpinions(id.replace(/-/g, ' '), { limit: 1 });
		if(results.length)
		{
			const mapped = await mapCl(results[0]);
			if(mapped)
			{
				await db.collection('cases').replaceOne({ id: mapped.id }, mapped, { upsert: true });
				return mapped as unknown as Case;
			}
		}
		return null;
	}
	catch
	{
		return null;
	}
}

type Props = { params: Promise<{ id: string }> };

export default async function CasePage({ params }: Props)
{
	const { id } = await params;
	const c = await getCase(id);
	if(!c) notFound();

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
							<BreadcrumbPage>{c.name}</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="mb-8">
					<h1 className="text-4xl font-bold tracking-tight mb-4">{c.name}</h1>
					<div className="flex flex-wrap items-center gap-3">
						<Badge variant="secondary" className="px-3 py-1 font-medium">{c.category}</Badge>
						<span className="text-sm font-medium text-muted-foreground">{c.year}</span>
						<span className="text-sm text-muted-foreground">•</span>
						<span className="text-sm text-muted-foreground">{c.citation}</span>
						{c.court_listener_link && (
							<>
								<span className="text-sm text-muted-foreground">•</span>
								<a
									href={c.court_listener_link}
									target="_blank"
									rel="noreferrer"
									className="text-sm font-medium text-primary hover:underline hover:text-primary/80 transition-colors flex items-center gap-1.5 inline-flex"
								>
									CourtListener
									<ExternalLink className="w-3.5 h-3.5" />
								</a>
							</>
						)}
					</div>
				</div>

				<div 
					className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed mb-12 whitespace-pre-line text-base"
					dangerouslySetInnerHTML={{ __html: marked.parse(c.summary) as string }}
				/>

				<Card className="bg-muted/30 border-muted">
					<CardHeader>
						<CardTitle className="text-2xl">Which side are you arguing?</CardTitle>
						<CardDescription className="text-base text-muted-foreground mt-1">
							Your position shapes how the AI assists and how the panel evaluates your brief.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid sm:grid-cols-2 gap-4 mt-2">
							<Button asChild size="lg" className="w-full text-base h-16 group relative overflow-hidden transition-all hover:ring-2 hover:ring-primary hover:ring-offset-2">
								<Link href={`/cases/${c.id}/brief?side=plaintiff`} className="flex flex-row items-center justify-center gap-3">
									<Scale className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
									<span>Argue as Plaintiff</span>
								</Link>
							</Button>
							<Button asChild size="lg" variant="outline" className="w-full text-base h-16 group relative overflow-hidden transition-all hover:bg-muted/80">
								<Link href={`/cases/${c.id}/brief?side=defendant`} className="flex flex-row items-center justify-center gap-3">
									<Shield className="w-5 h-5 transition-transform group-hover:scale-110 shrink-0" />
									<span>Argue as Defense</span>
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
