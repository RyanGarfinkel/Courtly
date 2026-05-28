'use client';

import RulingCeremony from '@/app/cases/[id]/hearing/ruling-ceremony';
import { HearingRuling } from '@/types/hearing';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props
{
	hearingId: string;
	side: 'plaintiff' | 'defendant';
}

export default function ResultsContent({ hearingId, side }: Props)
{
	const router = useRouter();
	const [loading, setLoading] = useState(true);
	const [ruling, setRuling] = useState<HearingRuling | null>(null);

	useEffect(() =>
	{
		const stored = sessionStorage.getItem(`hearing_${hearingId}`);
		if(stored)
		{
			const data = JSON.parse(stored);
			if(data.ruling) setRuling(data.ruling);
		}
		setLoading(false);
	}, [hearingId]);

	if(loading)
	{
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-40 w-full" />
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-64 w-full" />
			</div>
		);
	}

	if(!ruling)
	{
		return (
			<div className="flex flex-col items-center justify-center py-24 gap-4">
				<p className="text-muted-foreground">No ruling found for this hearing.</p>
				<Button variant="outline" onClick={() => router.push('/dashboard')}>
					Back to Dashboard
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-8 pb-16">
			<RulingCeremony ruling={ruling} side={side} />

			<div className="flex justify-center pt-4 border-t border-border">
				<Button onClick={() => router.push('/dashboard')}>
					Back to Dashboard
				</Button>
			</div>
		</div>
	);
}
