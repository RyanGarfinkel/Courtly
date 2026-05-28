'use client';

import { UIJudge } from '@/types/hearing';
import { cn } from '@/lib/utils';

interface Props
{
	judges: UIJudge[];
	activeSpeakerId: string | null;
	spokenIds: Set<string>;
	loading: boolean;
}

export default function Bench3D({ judges, activeSpeakerId, spokenIds, loading }: Props)
{
	return (
		<div
			className="relative w-full shrink-0 overflow-hidden"
			style={{ height: '140px' }}
			role="region"
			aria-label="The Bench"
		>
			<div
				className="absolute inset-0"
				style={{
					background: 'oklch(0.16 0.025 265)',
					borderBottom: '1px solid oklch(1 0 0 / 8%)',
				}}
			>
				<div className="absolute top-2 left-1/2 -translate-x-1/2 pointer-events-none z-10">
					<p className="text-[7px] tracking-[0.25em] uppercase text-white/20 font-medium whitespace-nowrap">
						Supreme Court of the United States
					</p>
				</div>
				{judges.map((j, i) =>
				{
					const t = i / Math.max(judges.length - 1, 1);
					const xPct = 6 + 88 * t;
					const yPct = 68 - 28 * 4 * t * (1 - t);

					const isActive = activeSpeakerId === j.id;
					const hasSpoken = spokenIds.has(j.id);

					return (
						<div
							key={j.id}
							title={j.name}
							className="absolute flex flex-col items-center gap-1"
							style={{
								left: `${xPct}%`,
								top: `${yPct}%`,
								transform: 'translate(-50%, -50%)',
							}}
						>
							<div
								className={cn(
									'rounded-full overflow-hidden border-2 transition-all duration-300',
									'hover:opacity-100 hover:scale-105 cursor-default',
									isActive
										? 'w-11 h-11 border-primary ring-2 ring-primary ring-offset-2 ring-offset-[oklch(0.16_0.025_265)] scale-110'
										: hasSpoken
											? 'w-9 h-9 border-white/20 opacity-80'
											: 'w-9 h-9 border-white/10 opacity-30 grayscale',
									isActive && loading ? 'judge-speaking' : '',
								)}
							>
								{j.image
									? (
										<img
											src={j.image}
											alt={j.name}
											className="w-full h-full object-cover"
										/>
									)
									: (
										<div className="w-full h-full flex items-center justify-center bg-white/10">
											<span className="text-[10px] font-bold text-white/80">{j.short}</span>
										</div>
									)
								}
							</div>
							<span
								className={cn(
									'text-[8px] leading-none text-center whitespace-nowrap transition-all duration-300',
									isActive ? 'text-amber-200 opacity-100' : 'text-white/40 opacity-60',
								)}
								style={{ maxWidth: '52px', overflow: 'hidden', textOverflow: 'ellipsis' }}
							>
								{j.name.replace('Justice ', '')}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}
