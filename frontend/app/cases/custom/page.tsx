'use client';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { useState } from 'react';

const CustomCasePage = () =>
{
	const router = useRouter();
	const [name, setName] = useState('');
	const [summary, setSummary] = useState('');
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState('');

	const handleSubmit = async (e: React.FormEvent) =>
	{
		e.preventDefault();
		if(!name.trim() || !summary.trim()) return;

		setSubmitting(true);
		setError('');
		try
		{
			const res = await fetch(`${API_URL}/cases`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ name: name.trim(), summary: summary.trim() }),
			});
			if(!res.ok) throw new Error('Failed to create case');
			const newCase = await res.json();
			router.push(`/cases/${newCase.id}`);
		}
		catch
		{
			setError('Something went wrong. Make sure the backend is running.');
			setSubmitting(false);
		}
	};

	return (
		<main className='flex-1 px-8 py-10'>
			<div className='max-w-2xl mx-auto'>
				<Breadcrumb className='mb-10'>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href='/dashboard'>Cases</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbPage>Custom case</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>

				<div className='mb-10'>
					<p className='label-caps text-muted-foreground mb-3'>New Case</p>
					<h1 className='font-heading text-3xl font-bold text-foreground mb-3'>
						Create a Custom Case
					</h1>
					<p className='text-sm text-muted-foreground leading-relaxed'>
						Define a legal scenario to bring before the nine-justice panel. You'll write your argument on the next page.
					</p>
				</div>

				<div className='section-rule' />

				<form onSubmit={handleSubmit} className='flex flex-col gap-6'>
					<div className='flex flex-col gap-2'>
						<label htmlFor='name' className='text-sm font-medium text-foreground'>
							Case name
						</label>
						<Input
							id='name'
							value={name}
							onChange={e => setName(e.target.value)}
							placeholder='e.g. Smith v. State of New York'
							className='rounded-sm h-11'
						/>
					</div>

					<div className='flex flex-col gap-2'>
						<label htmlFor='summary' className='text-sm font-medium text-foreground'>
							Case summary
						</label>
						<p className='text-xs text-muted-foreground'>
							Describe the facts and the legal question at issue.
						</p>
						<Textarea
							id='summary'
							value={summary}
							onChange={e => setSummary(e.target.value)}
							rows={7}
							placeholder='Describe what happened and what constitutional or legal question is at stake...'
							className='rounded-sm resize-none'
						/>
					</div>

					{error && (
						<p className='text-sm text-destructive'>{error}</p>
					)}

					<div className='flex justify-end pt-2'>
						<button
							type='submit'
							disabled={submitting || !name.trim() || !summary.trim()}
							className='inline-flex items-center justify-center rounded-sm bg-primary text-primary-foreground px-6 py-2.5 text-sm font-semibold hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity disabled:opacity-40 disabled:cursor-not-allowed'
						>
							{submitting ? 'Creating...' : 'Create Case →'}
						</button>
					</div>
				</form>
			</div>
		</main>
	);
};

export default CustomCasePage;
