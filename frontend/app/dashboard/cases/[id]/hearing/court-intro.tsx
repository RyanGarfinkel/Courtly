'use client';

import { JUDGES } from './judges';
import { Button } from '@/components/ui/button';

interface Case
{
	id: string;
	name: string;
	year: number;
	citation: string;
}

interface Props
{
	case_: Case;
	side: 'plaintiff' | 'defendant';
	onBegin: () => void;
}

export default function CourtIntro({ case_, side, onBegin }: Props)
{
	const BENCH_ROW_1 = JUDGES.slice(0, 5);
	const BENCH_ROW_2 = JUDGES.slice(5);

	return (
		<div className="flex flex-col items-center justify-center flex-1 gap-10 py-12 text-center">
			<div className="flex flex-col items-center gap-3">
				<p className="text-xs tracking-[0.3em] uppercase text-muted-foreground font-medium">
					Supreme Court of the United States
				</p>
				<div className="w-16 h-px bg-border" />
				<h1 className="text-2xl font-bold">{case_.name}</h1>
				<p className="text-sm text-muted-foreground">{case_.citation} · {case_.year}</p>
				<p className="text-xs text-muted-foreground mt-1">
					Arguing as {side === 'plaintiff' ? 'Petitioner' : 'Respondent'}
				</p>
			</div>

			<div className="flex flex-col items-center gap-6">
				<p className="text-xs tracking-[0.2em] uppercase text-muted-foreground">The Bench</p>
				<div className="flex flex-col items-center gap-4">
					<div className="flex gap-6">
						{BENCH_ROW_1.map(j => (
							<div key={j.id} className="flex flex-col items-center gap-1.5">
								<div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
									<span className="text-xs font-semibold text-muted-foreground">{j.short}</span>
								</div>
								<span className="text-[10px] text-muted-foreground whitespace-nowrap">{j.name.replace('Justice ', '')}</span>
							</div>
						))}
					</div>
					<div className="flex gap-6">
						{BENCH_ROW_2.map(j => (
							<div key={j.id} className="flex flex-col items-center gap-1.5">
								<div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
									<span className="text-xs font-semibold text-muted-foreground">{j.short}</span>
								</div>
								<span className="text-[10px] text-muted-foreground whitespace-nowrap">{j.name.replace('Justice ', '')}</span>
							</div>
						))}
					</div>
				</div>
			</div>

			<div className="flex flex-col items-center gap-4">
				<p className="text-sm text-muted-foreground italic">
					"Oyez, Oyez, Oyez. All persons having business before the Honorable,<br />
					the Supreme Court of the United States, are admonished to draw near."
				</p>
				<Button size="lg" onClick={onBegin}>
					Begin Oral Argument →
				</Button>
			</div>
		</div>
	);
}
