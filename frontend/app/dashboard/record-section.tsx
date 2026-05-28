'use client';

import { JudicialStats, HearingRecord } from '@/types/record';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const SkeletonRow = () =>
{
	return (
		<div className='flex items-center justify-between gap-4 px-4 py-3 border-b border-border last:border-0 animate-pulse'>
			<div className='flex flex-col gap-1.5 flex-1'>
				<div className='h-3.5 w-40 bg-muted rounded' />
				<div className='h-3 w-24 bg-muted rounded' />
			</div>
			<div className='h-4 w-12 bg-muted rounded' />
		</div>
	);
};

const RecordRow = ({ record }: { record: HearingRecord }) =>
{
	const won = record.result === 'affirmed';
	const date = new Date(record.argued_at).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	});

	return (
		<Link
			href={`/transcripts/${record.hearing_id}`}
			className='flex items-center justify-between gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
		>
			<div className='flex flex-col gap-0.5 min-w-0'>
				<span className='text-sm font-medium truncate'>{record.case_name}</span>
				<span className='text-xs text-muted-foreground'>
					{record.side === 'plaintiff' ? 'Petitioner' : 'Respondent'} · {date} · Score: {Math.round(record.scores.overall)}
				</span>
			</div>
			<div className='flex items-center gap-2 shrink-0'>
				<Badge
					variant={won ? 'default' : 'outline'}
					className={`text-[10px] rounded-sm ${won ? 'bg-green-600 hover:bg-green-600 text-white border-transparent' : 'text-red-500 border-red-500/40'}`}
				>
					{won ? 'W' : 'L'}
				</Badge>
				<span className='text-[10px] text-muted-foreground'>View →</span>
			</div>
		</Link>
	);
};

const RecordSection = () =>
{
	const [stats, setStats] = useState<JudicialStats | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() =>
	{
		const load = async () =>
		{
			try
			{
				const res = await fetch('/api/record');
				if(!res.ok) return;
				const data: JudicialStats = await res.json();
				setStats(data);
			}
			catch {}
			finally
			{
				setLoading(false);
			}
		};

		load();
	}, []);

	if(loading)
	{
		return (
			<div className='mb-10'>
				<div className='h-3 w-20 bg-muted rounded animate-pulse mb-4' />
				<div className='border border-border rounded-sm overflow-hidden'>
					{Array.from({ length: 3 }).map((_, i) => (
						<SkeletonRow key={i} />
					))}
				</div>
			</div>
		);
	}

	if(!stats || stats.total_cases === 0)
	{
		return (
			<div className='mb-10'>
				<p className='label-caps text-muted-foreground mb-4'>Your Record</p>
				<p className='text-sm text-muted-foreground'>No hearings argued yet.</p>
			</div>
		);
	}

	const winRatePct = Math.round(stats.win_rate * 100);

	return (
		<div className='mb-10'>
			<p className='label-caps text-muted-foreground mb-4'>Your Record</p>

			<div className='flex items-center gap-6 mb-5 px-1 py-3 border-b border-border'>
				<div className='flex flex-col'>
					<span className='font-heading text-3xl font-bold tabular-nums'>
						<span className='text-green-700'>{stats.wins}</span>–{stats.losses}
					</span>
					<span className='text-xs text-muted-foreground'>{winRatePct}% win rate</span>
				</div>
				<div className='h-8 w-px bg-border' />
				<div className='flex flex-col'>
					<span className='font-heading text-3xl font-bold tabular-nums'>{Math.round(stats.avg_overall_score)}</span>
					<span className='text-xs text-muted-foreground'>Avg score</span>
				</div>
				<div className='h-8 w-px bg-border' />
				<div className='flex flex-col'>
					<span className='font-heading text-3xl font-bold tabular-nums'>{stats.total_cases}</span>
					<span className='text-xs text-muted-foreground'>Cases argued</span>
				</div>
			</div>

			<div className='border border-border rounded-sm overflow-hidden'>
				{stats.recent_records.map(record => (
					<RecordRow key={record.record_id} record={record} />
				))}
			</div>
		</div>
	);
};

export default RecordSection;
