export default function Loading()
{
	return (
		<main className="flex-1 px-8 py-10">
			<div className="max-w-3xl mx-auto animate-pulse">
				<div className="h-4 w-48 bg-muted rounded mb-8" />

				<div className="flex items-center gap-3 mb-3">
					<div className="h-5 w-24 bg-muted rounded-full" />
					<div className="h-4 w-10 bg-muted rounded" />
					<div className="h-4 w-24 bg-muted rounded" />
				</div>

				<div className="h-9 w-96 bg-muted rounded mb-6" />

				<div className="flex flex-col gap-2 mb-10">
					<div className="h-4 w-full bg-muted rounded" />
					<div className="h-4 w-full bg-muted rounded" />
					<div className="h-4 w-5/6 bg-muted rounded" />
					<div className="h-4 w-full bg-muted rounded" />
					<div className="h-4 w-3/4 bg-muted rounded" />
				</div>

				<div className="flex flex-col gap-3">
					<div className="h-4 w-40 bg-muted rounded" />
					<div className="flex gap-3">
						<div className="h-11 w-44 bg-muted rounded" />
						<div className="h-11 w-44 bg-muted rounded" />
					</div>
				</div>
			</div>
		</main>
	);
}
