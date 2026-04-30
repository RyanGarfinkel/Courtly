'use client';

import { JUDGES } from './judges';
import { cn } from '@/lib/utils';

interface Props
{
	activeSpeakerId: string | null;
	spokenIds: Set<string>;
}

export default function BenchArc({ activeSpeakerId, spokenIds }: Props)
{
	return (
		<div className="relative w-full h-20 shrink-0 overflow-hidden">
			{JUDGES.map((j, i) =>
			{
				const t = i / 8;
				const xPct = 10 + 80 * t;
				const yPct = 65 - 20 * 4 * t * (1 - t);

				const isActive = activeSpeakerId === j.id;
				const hasSpoken = spokenIds.has(j.id);

				return (
					<div
						key={j.id}
						title={j.name}
						className={cn(
							'absolute rounded-full overflow-hidden transition-all duration-300',
							isActive
								? 'w-11 h-11 ring-2 ring-foreground ring-offset-1 ring-offset-background shadow-lg'
								: hasSpoken
									? 'w-8 h-8 opacity-80'
									: 'w-8 h-8 opacity-30 grayscale',
						)}
						style={{
							left: `${xPct}%`,
							top: `${yPct}%`,
							transform: 'translate(-50%, -50%)',
						}}
					>
						<img
							src={j.image}
							alt={j.name}
							className="w-full h-full object-cover"
						/>
					</div>
				);
			})}
		</div>
	);
}
