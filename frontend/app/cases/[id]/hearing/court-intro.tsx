'use client';

import { UIJudge } from '@/types/hearing';
import { useCase } from '@/contexts/case';
import { cn } from '@/lib/utils';

interface Props
{
	side: 'plaintiff' | 'defendant';
	onBegin: () => void;
	judges: UIJudge[];
}

const CourtIntro = ({ side, onBegin, judges }: Props) =>
{
	const case_ = useCase();
	const row1 = judges.slice(0, 5);
	const row2 = judges.slice(5);

	return (
		<div className='animate-fade-in flex flex-col items-center justify-center flex-1 gap-10 py-12 text-center px-8'>
			<div className='flex flex-col items-center gap-3'>
				<p className='text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-semibold'>
					Supreme Court of the United States
				</p>
				<div className='w-20 h-px bg-border' />
				<h1 className='font-heading text-3xl font-bold leading-tight'>{case_.name}</h1>
				<div className='flex items-center gap-2 flex-wrap justify-center'>
					<p className='text-sm text-muted-foreground'>{case_.citation} · {case_.year}</p>
					{case_.category && (
						<span className='text-[10px] px-2 py-0.5 rounded-sm bg-secondary text-secondary-foreground font-medium'>
							{case_.category}
						</span>
					)}
				</div>
				<p className='text-xs text-muted-foreground mt-1'>
					Arguing as {side === 'plaintiff' ? 'Petitioner' : 'Respondent'}
				</p>
			</div>

			<div className='flex flex-col items-center gap-5'>
				<p className='text-[10px] tracking-[0.25em] uppercase text-muted-foreground font-medium'>The Bench</p>
				<div className='flex flex-col items-center gap-5'>
					<BenchRow judges={row1} offset={0} />
					{row2.length > 0 && <BenchRow judges={row2} offset={5} />}
				</div>
			</div>

			<div className='flex flex-col items-center gap-5 max-w-md'>
				<p className='text-sm text-muted-foreground italic leading-relaxed' style={{ fontFamily: 'var(--font-sans)' }}>
					"Oyez, Oyez, Oyez. All persons having business before the Honorable,
					the Supreme Court of the United States, are admonished to draw near."
				</p>
				<p className='text-xs text-muted-foreground/70 leading-relaxed'>
					You will face questioning from the bench, present your oral argument,
					and receive a ruling based on the strength of your argument.
				</p>
				<button
					type='button'
					onClick={onBegin}
					className={cn(
						'mt-2 inline-flex items-center justify-center rounded-sm bg-primary text-primary-foreground',
						'px-12 py-3.5 text-sm font-semibold tracking-wide',
						'hover:opacity-90 transition-all duration-200',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
						'active:scale-[0.98]',
					)}
				>
					Begin Oral Argument →
				</button>
			</div>
		</div>
	);
};

const BenchRow = ({ judges, offset = 0 }: { judges: UIJudge[]; offset?: number }) =>
{
	return (
		<div className='flex gap-5 flex-wrap justify-center'>
			{judges.map((j, i) => (
				<div
					key={j.id}
					className='flex flex-col items-center gap-1.5 animate-fade-in'
					style={{ animationDelay: `${(offset + i) * 60}ms`, animationFillMode: 'both' }}
				>
					<div
						className={cn(
							'w-11 h-11 rounded-full overflow-hidden border-2 border-border',
							'bg-muted flex items-center justify-center',
							'transition-transform duration-200 hover:scale-105',
						)}
					>
						{j.image
							? (
								<img src={j.image} alt={j.name} className='w-full h-full object-cover' />
							)
							: (
								<span className='text-xs font-semibold text-muted-foreground'>{j.short}</span>
							)
						}
					</div>
					<span className='text-[10px] font-medium text-muted-foreground whitespace-nowrap' style={{ fontFamily: 'var(--font-heading)' }}>
						{j.name.replace('Justice ', '')}
					</span>
					<span className='text-[9px] text-muted-foreground/50 whitespace-nowrap'>
						{j.philosophy}
					</span>
				</div>
			))}
		</div>
	);
};

export default CourtIntro;
