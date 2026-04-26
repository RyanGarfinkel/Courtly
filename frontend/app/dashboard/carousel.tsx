'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Case } from '@/types/case';

interface Props
{
	cases: Case[];
	renderCard: (c: Case) => React.ReactNode;
}

export default function Carousel({ cases, renderCard }: Props)
{
	const trackRef = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(0);

	const pages = Math.max(1, Math.ceil(cases.length / 3));
	const maxIndex = Math.max(0, pages - 1);

	useEffect(() =>
	{
		if(!trackRef.current) return;
		const track = trackRef.current;
		const clamped = Math.min(Math.max(0, index), maxIndex);
		track.scrollTo({ left: clamped * (track.clientWidth + 16), behavior: 'smooth' });
	}, [index, maxIndex]);

	return (
		<div className="relative w-full overflow-hidden group">
			<div
				tabIndex={0}
				onKeyDown={e =>
				{
					if(e.key === 'ArrowLeft') setIndex(p => Math.max(0, p - 1));
					if(e.key === 'ArrowRight') setIndex(p => Math.min(maxIndex, p + 1));
				}}
				className="outline-none"
			>
				<div ref={trackRef} className="flex overflow-x-auto scroll-smooth no-scrollbar gap-4 px-6 py-2">
					{cases.map(c => (
						<div key={c.id} className="flex-none w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-10.666px)]">
							{renderCard(c)}
						</div>
					))}
				</div>
			</div>

			{pages > 1 && (
				<>
					<div className="absolute left-0 top-1/2 -translate-y-1/2 z-50">
						<button
							onClick={() => setIndex(p => Math.max(0, p - 1))}
							aria-label="Previous"
							disabled={index <= 0}
							className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground text-background shadow-lg border border-border disabled:opacity-0 disabled:cursor-not-allowed transition-opacity hover:bg-foreground/90"
						>
							<ChevronLeft className="w-6 h-6" />
						</button>
					</div>

					<div className="absolute right-0 top-1/2 -translate-y-1/2 z-50">
						<button
							onClick={() => setIndex(p => Math.min(maxIndex, p + 1))}
							aria-label="Next"
							disabled={index >= pages - 1}
							className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground text-background shadow-lg border border-border disabled:opacity-0 disabled:cursor-not-allowed transition-opacity hover:bg-foreground/90"
						>
							<ChevronRight className="w-6 h-6" />
						</button>
					</div>

					<div className="flex items-center justify-center gap-2 mt-2">
						{Array.from({ length: pages }).map((_, i) => (
							<button
								key={i}
								onClick={() => setIndex(Math.min(i, maxIndex))}
								aria-label={`Go to page ${i + 1}`}
								className={`w-2 h-2 rounded-full transition-colors ${i === index ? 'bg-foreground' : 'bg-border hover:bg-muted-foreground'}`}
							/>
						))}
					</div>
				</>
			)}
		</div>
	);
}
