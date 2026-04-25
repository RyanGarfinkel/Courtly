import { auth0 } from "@/lib/auth0";
import Link from "next/link";

export default async function DashboardLayout({ children }: { children: React.ReactNode })
{
	const session = await auth0.getSession();
	const user = session?.user ?? null;

	return (
		<div className="flex flex-col min-h-screen bg-background text-foreground">
			<header className="flex items-center justify-between px-8 py-5 border-b border-border">
				<Link
					href="/dashboard"
					className="font-semibold text-lg hover:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					Courtly
				</Link>
				<div className="flex items-center gap-4">
					{user ? (
						<>
							<span className="text-sm text-muted-foreground">{user.email}</span>
							<Link
								href="/auth/logout"
								className="text-sm font-medium hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
							>
								Sign out
							</Link>
						</>
					) : (
						<>
							<span className="text-sm text-muted-foreground">Guest</span>
							<Link
								href="/auth/login?returnTo=/dashboard"
								className="text-sm font-medium hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
							>
								Sign in
							</Link>
						</>
					)}
				</div>
			</header>
			{children}
		</div>
	);
}
