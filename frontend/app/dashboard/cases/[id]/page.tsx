import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface Case
{
	id: string;
	name: string;
	year: number;
	category: string;
	summary: string;
	citation: string;
}

async function getCase(id: string): Promise<Case | null>
{
	try
	{
		const res = await fetch(`${process.env.API_URL ?? "http://localhost:8000"}/cases`, { cache: "no-store" });
		if(!res.ok) return null;
		const cases: Case[] = await res.json();
		return cases.find(c => c.id === id) ?? null;
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

				<div className="flex items-center gap-3 mb-3">
					<Badge variant="secondary">{c.category}</Badge>
					<span className="text-xs text-muted-foreground">{c.year}</span>
					<span className="text-xs text-muted-foreground">{c.citation}</span>
				</div>

				<h1 className="text-3xl font-bold mb-6">{c.name}</h1>

				<div className="prose-sm text-muted-foreground leading-relaxed mb-10 whitespace-pre-line">
					{c.summary}
				</div>

				<div className="flex flex-col gap-3">
					<div>
						<p className="text-sm font-medium mb-1">Which side are you arguing?</p>
						<p className="text-xs text-muted-foreground">Your position shapes how the AI assists and how the panel evaluates your brief.</p>
					</div>
					<div className="flex gap-3">
						<Link href={`/dashboard/cases/${c.id}/brief?side=plaintiff`}>
							<Button size="lg">Argue as Plaintiff →</Button>
						</Link>
						<Link href={`/dashboard/cases/${c.id}/brief?side=defendant`}>
							<Button size="lg" variant="outline">Argue as Defense →</Button>
						</Link>
					</div>
				</div>
			</div>
		</main>
	);
}
