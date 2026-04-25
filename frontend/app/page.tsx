import Image from "next/image";
import Link from "next/link";

const JUDGES = [
	{ src: "/assets/judges/Roberts_8807-16_Crop.jpg", name: "Roberts" },
	{ src: "/assets/judges/Thomas_9366-024_Crop.jpg", name: "Thomas" },
	{ src: "/assets/judges/Alito_9264-001-Crop.jpg", name: "Alito" },
	{ src: "/assets/judges/Sotomayor_Official_2025.jpg", name: "Sotomayor" },
	{ src: "/assets/judges/Kagan_10713-017-Crop.jpg", name: "Kagan" },
	{ src: "/assets/judges/Gorsuch2.jpg", name: "Gorsuch" },
	{ src: "/assets/judges/Kavanaugh 12221_005_crop.jpg", name: "Kavanaugh" },
	{ src: "/assets/judges/Barrett_102535_w151.jpg", name: "Barrett" },
	{ src: "/assets/judges/KBJackson3.jpg", name: "Jackson" },
];

export default function Home()
{
	return (
		<main className="flex flex-col min-h-screen bg-background text-foreground">
			<div className="flex flex-col items-center justify-center flex-1 px-6 py-24 text-center">
				<h1 className="text-5xl font-bold tracking-tight mb-4">Courtly</h1>
				<p className="text-muted-foreground text-lg max-w-xl mb-12">
					Submit your case to a nine-justice AI panel. Every argument attacked,
					every claim verified, every ruling earned.
				</p>

				<div className="flex flex-wrap justify-center gap-4 mb-16">
					{JUDGES.map((judge) => (
						<div key={judge.name} className="flex flex-col items-center gap-2">
							<div className="w-16 h-16 rounded-full overflow-hidden border border-border">
								<Image
									src={judge.src}
									alt={judge.name}
									width={64}
									height={64}
									className="w-full h-full object-cover object-top"
								/>
							</div>
						</div>
					))}
				</div>

				<div className="flex flex-col sm:flex-row gap-4">
					<Link
						href="/auth/login?screen_hint=signup&returnTo=/dashboard"
						className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-3 font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity"
					>
						Create account
					</Link>
					<Link
						href="/auth/login?returnTo=/dashboard"
						className="inline-flex items-center justify-center rounded-md border border-border px-6 py-3 font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
					>
						Sign in
					</Link>
				</div>
			</div>
		</main>
	);
}
