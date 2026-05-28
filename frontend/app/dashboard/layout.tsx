import { auth0 } from '@/lib/auth0';
import Logo from '@/components/logo';
import Link from 'next/link';

const DashboardLayout = async ({ children }: { children: React.ReactNode }) =>
{
	const session = await auth0.getSession();
	const user = session?.user ?? null;

	return (
		<div className='flex flex-col min-h-screen bg-background text-foreground'>
			<header className='flex items-center justify-between px-8 h-14 bg-background border-b border-border'>
				<Link
					href='/dashboard'
					className='flex items-center gap-2.5 hover:opacity-75 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded'
				>
					<Logo size={18} className='text-primary shrink-0' />
					<div className='flex flex-col gap-0'>
						<span className='font-heading font-bold text-lg leading-tight'>Courtly</span>
						<span className='label-caps text-muted-foreground' style={{ fontSize: '0.55rem' }}>Supreme Court Simulator</span>
					</div>
				</Link>

				<div className='flex items-center gap-5'>
					<Link
						href='/learn'
						className='text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors'
					>
						Learn
					</Link>
					<Link
						href='/cases/custom'
						className='inline-flex items-center justify-center rounded-sm bg-primary text-primary-foreground px-4 py-1.5 text-sm font-medium hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-opacity'
					>
						New Argument
					</Link>

					{user ? (
						<>
							<span className='text-sm text-muted-foreground hidden sm:block'>{user.email}</span>
							<Link
								href='/auth/logout'
								className='text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors'
							>
								Sign out
							</Link>
						</>
					) : (
						<Link
							href='/auth/login?returnTo=/dashboard'
							className='text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors'
						>
							Sign in
						</Link>
					)}
				</div>
			</header>
			<div style={{ height: '2px', background: 'linear-gradient(to right, transparent, oklch(0.40 0.14 15 / 0.2), transparent)' }} />

			{children}
		</div>
	);
};

export default DashboardLayout;
