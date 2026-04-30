import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiplayerMatch } from "@/types/multiplayer";
import { notFound } from "next/navigation";
import { Shield, Scale } from "lucide-react";
import LobbyActions from "./lobby-actions";
import { auth0 } from "@/lib/auth0";
import { getDb } from "@/lib/mongo";

async function getMatch(matchId: string): Promise<MultiplayerMatch | null>
{
	try
	{
		const db = await getDb();
		const doc = await db.collection('multiplayer_matches').findOne(
			{ match_id: matchId },
			{ projection: { _id: 0 } }
		);
		return doc ? doc as unknown as MultiplayerMatch : null;
	}
	catch
	{
		return null;
	}
}

type Props = { params: Promise<{ match_id: string }> };

export default async function MatchLobbyPage({ params }: Props)
{
	const { match_id } = await params;
	const [match, session] = await Promise.all([getMatch(match_id), auth0.getSession()]);

	if(!match) notFound();

	const userId = session?.user?.sub ?? null;

	return (
		<main className="flex-1 px-8 py-10">
			<div className="max-w-2xl mx-auto">
				<Breadcrumb className="mb-8">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="/dashboard">Cases</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink href={`/cases/${match.case_id}`}>{match.case_name}</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Match Lobby</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className="flex flex-col gap-6">
					<div>
						<p className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-2">
							Head-to-Head
						</p>
						<h1 className="text-3xl font-bold tracking-tight">{match.case_name}</h1>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<Card className={match.plaintiff ? 'border-foreground/20' : 'border-dashed border-muted-foreground/20 bg-muted/10'}>
							<CardHeader className="pb-2 pt-4 px-4">
								<CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
									<Scale className="w-3.5 h-3.5" />
									Plaintiff
								</CardTitle>
							</CardHeader>
							<CardContent className="px-4 pb-4">
								{match.plaintiff ? (
									<p className="text-sm font-medium">{match.plaintiff.user_name}</p>
								) : (
									<p className="text-sm text-muted-foreground/60 italic">Waiting...</p>
								)}
							</CardContent>
						</Card>

						<Card className={match.defendant ? 'border-foreground/20' : 'border-dashed border-muted-foreground/20 bg-muted/10'}>
							<CardHeader className="pb-2 pt-4 px-4">
								<CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
									<Shield className="w-3.5 h-3.5" />
									Defense
								</CardTitle>
							</CardHeader>
							<CardContent className="px-4 pb-4">
								{match.defendant ? (
									<p className="text-sm font-medium">{match.defendant.user_name}</p>
								) : (
									<p className="text-sm text-muted-foreground/60 italic">Waiting...</p>
								)}
							</CardContent>
						</Card>
					</div>

					<LobbyActions match={match} userId={userId} />
				</div>
			</div>
		</main>
	);
}
