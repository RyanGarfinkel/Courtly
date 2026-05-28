'use client';

import { useEffect, useRef, useState } from 'react';
import { Shield, Scale, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';

interface Props
{
	caseId: string;
	caseName: string;
}

type Step = 'idle' | 'picking' | 'loading' | 'error';

const ChallengeButton = ({ caseId, caseName }: Props) =>
{
	const router = useRouter();
	const [step, setStep] = useState<Step>('idle');
	const [error, setError] = useState<string | null>(null);
	const cardRef = useRef<HTMLDivElement>(null);

	useEffect(() =>
	{
		if(step !== 'picking') return;

		const handleClick = (e: MouseEvent) =>
		{
			if(cardRef.current && !cardRef.current.contains(e.target as Node))
				setStep('idle');
		};

		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [step]);

	const challenge = async (side: 'plaintiff' | 'defendant') =>
	{
		setStep('loading');
		setError(null);

		try
		{
			const res = await fetch(`${API_URL}/multiplayer`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ case_id: caseId, case_name: caseName, side }),
			});

			if(!res.ok)
			{
				const body = await res.json().catch(() => ({}));
				throw new Error(body.error ?? 'Failed to create challenge');
			}

			const { match_id } = await res.json();
			const link = `${window.location.origin}/match/${match_id}`;
			await navigator.clipboard.writeText(link).catch(() => {});
			router.push(`/match/${match_id}`);
		}
		catch(err)
		{
			setError(err instanceof Error ? err.message : 'Something went wrong');
			setStep('error');
		}
	};

	return (
		<div ref={cardRef} className='border border-dashed border-border/60 rounded-sm p-4'>
			<div className='flex items-center gap-2 mb-1'>
				<Users className='w-3.5 h-3.5 text-muted-foreground' />
				<p className='text-sm font-medium text-foreground'>Challenge a Friend</p>
			</div>
			<p className='text-xs text-muted-foreground mb-3'>
				Create a head-to-head match. Your opponent argues the other side.
			</p>

			{step === 'idle' && (
				<button
					type='button'
					onClick={() => setStep('picking')}
					className='inline-flex items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium w-full hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
				>
					Pick your side
				</button>
			)}

			{step === 'picking' && (
				<div className='flex flex-col gap-2'>
					<p className='text-xs text-muted-foreground mb-1'>You argue as:</p>
					<button
						type='button'
						onClick={() => challenge('plaintiff')}
						className='flex items-center gap-2.5 px-3 py-2.5 rounded-sm border border-border text-sm font-medium hover:bg-muted/60 hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
					>
						<Scale className='w-4 h-4 text-muted-foreground shrink-0' />
						<span>Plaintiff — your opponent defends</span>
					</button>
					<button
						type='button'
						onClick={() => challenge('defendant')}
						className='flex items-center gap-2.5 px-3 py-2.5 rounded-sm border border-border text-sm font-medium hover:bg-muted/60 hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
					>
						<Shield className='w-4 h-4 text-muted-foreground shrink-0' />
						<span>Defense — your opponent argues plaintiff</span>
					</button>
				</div>
			)}

			{step === 'loading' && (
				<div className='flex items-center justify-center h-9'>
					<div className='w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin' />
				</div>
			)}

			{step === 'error' && (
				<div className='flex flex-col gap-2'>
					<p className='text-xs text-destructive'>{error}</p>
					<button
						type='button'
						onClick={() => setStep('picking')}
						className='inline-flex items-center justify-center rounded-sm border border-border px-4 py-2 text-sm font-medium w-full hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
					>
						Try again
					</button>
				</div>
			)}
		</div>
	);
};

export default ChallengeButton;
