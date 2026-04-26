'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Scale, Users, Check } from "lucide-react";
import { API_URL } from "@/lib/api";

interface Props
{
	caseId: string;
	caseName: string;
}

type Step = 'idle' | 'picking' | 'loading' | 'copied' | 'error';

export default function ChallengeButton({ caseId, caseName }: Props)
{
	const [step, setStep] = useState<Step>('idle');
	const [error, setError] = useState<string | null>(null);
	const cardRef = useRef<HTMLDivElement>(null);

	useEffect(() =>
	{
		if(step !== 'picking') return;

		function handleClick(e: MouseEvent)
		{
			if(cardRef.current && !cardRef.current.contains(e.target as Node))
				setStep('idle');
		}

		document.addEventListener('mousedown', handleClick);
		return () => document.removeEventListener('mousedown', handleClick);
	}, [step]);

	async function challenge(side: 'plaintiff' | 'defendant')
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
			await navigator.clipboard.writeText(link);
			setStep('copied');

			setTimeout(() => setStep('idle'), 3000);
		}
		catch(err)
		{
			setError(err instanceof Error ? err.message : 'Something went wrong');
			setStep('error');
		}
	}

	return (
		<Card ref={cardRef} className="bg-muted/20 border-dashed border-muted-foreground/20 mt-1">
			<CardHeader className="pb-2 pt-4 px-4">
				<CardTitle className="text-sm font-semibold flex items-center gap-2">
					<Users className="w-4 h-4 text-muted-foreground" />
					Challenge a Friend
				</CardTitle>
				<CardDescription className="text-xs text-muted-foreground">
					Create a head-to-head match. Your opponent argues the other side.
				</CardDescription>
			</CardHeader>
			<CardContent className="px-4 pb-4">
				{step === 'idle' && (
					<Button
						variant="outline"
						size="sm"
						className="w-full h-9 text-sm transition-all hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
						onClick={() => setStep('picking')}
					>
						Pick your side
					</Button>
				)}

				{step === 'picking' && (
					<div className="flex flex-col gap-2 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-1 motion-safe:duration-150">
						<p className="text-xs text-muted-foreground mb-1">You argue as:</p>
						<button
							onClick={() => challenge('plaintiff')}
							className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted/60 hover:border-primary/40 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<Scale className="w-4 h-4 text-muted-foreground shrink-0" />
							<span>Plaintiff — your opponent defends</span>
						</button>
						<button
							onClick={() => challenge('defendant')}
							className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border text-sm font-medium hover:bg-muted/60 hover:border-primary/40 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<Shield className="w-4 h-4 text-muted-foreground shrink-0" />
							<span>Defense — your opponent argues plaintiff</span>
						</button>
					</div>
				)}

				{step === 'loading' && (
					<div className="flex items-center justify-center h-9">
						<div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
					</div>
				)}

				{step === 'copied' && (
					<div className="flex items-center gap-2 justify-center py-1.5 text-sm text-muted-foreground motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200">
						<Check className="w-4 h-4 text-green-500" />
						<span>Link copied — share it with your opponent</span>
					</div>
				)}

				{step === 'error' && (
					<div className="flex flex-col gap-2">
						<p className="text-xs text-destructive">{error}</p>
						<Button
							variant="outline"
							size="sm"
							className="w-full h-9 text-sm"
							onClick={() => setStep('picking')}
						>
							Try again
						</Button>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
