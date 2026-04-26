import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Case } from "@/types/case";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ExternalLink, Scale, Shield } from "lucide-react";

async function getCase(id: string): Promise<Case | null>
{
	try
	{
		const res = await fetch(`${process.env.API_URL ?? "http://localhost:8000"}/cases/${id}`, { next: { revalidate: 3600 } });
		if(!res.ok) return null;
		return await res.json();
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

				<div className="prose prose-slate dark:prose-invert max-w-none text-muted-foreground leading-relaxed mb-12 whitespace-pre-line text-base">
					{c.summary}
				</div>

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
								<Link href={`/dashboard/cases/${c.id}/brief?side=plaintiff`}>
									<Scale className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
									Argue as Plaintiff
								</Link>
							</Button>
							<Button asChild size="lg" variant="outline" className="w-full text-base h-16 group relative overflow-hidden transition-all hover:bg-muted/80">
								<Link href={`/dashboard/cases/${c.id}/brief?side=defendant`}>
									<Shield className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" />
									Argue as Defense
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</main>
	);
}
