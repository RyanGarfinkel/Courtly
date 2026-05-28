import Link from 'next/link';
import Cards from './cards';

const LearnPage = () =>
{
	return (
		<div className='flex flex-col min-h-screen bg-background text-foreground'>
			<header className='flex items-center justify-between px-8 h-14 border-b border-border bg-background'>
				<Link
					href='/dashboard'
					className='font-heading font-bold text-lg hover:opacity-75 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded'
				>
					Courtly
				</Link>
				<Link
					href='/dashboard'
					className='text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded'
				>
					← Back to Docket
				</Link>
			</header>

			<main className='flex-1 px-8 py-10'>
				<div className='max-w-4xl mx-auto'>
					<p className='label-caps text-muted-foreground mb-3'>Study Guide</p>
					<h1 className='case-headline text-foreground mb-3'>How It Works</h1>
					<p
						className='text-base text-muted-foreground mb-8 italic'
						style={{ fontFamily: 'var(--font-sans)' }}
					>
						Master the argument. Understand the bench. Earn your ruling.
					</p>
					<div className='section-rule' />
					<Cards />
				</div>
			</main>
		</div>
	);
};

export default LearnPage;
