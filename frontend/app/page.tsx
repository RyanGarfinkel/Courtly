import Image from 'next/image';
import Link from 'next/link';

const JUDGES = [
	{ src: '/assets/judges/Roberts_8807-16_Crop.jpg', name: 'Roberts' },
	{ src: '/assets/judges/Thomas_9366-024_Crop.jpg', name: 'Thomas' },
	{ src: '/assets/judges/Alito_9264-001-Crop.jpg', name: 'Alito' },
	{ src: '/assets/judges/Sotomayor_Official_2025.jpg', name: 'Sotomayor' },
	{ src: '/assets/judges/Kagan_10713-017-Crop.jpg', name: 'Kagan' },
	{ src: '/assets/judges/Gorsuch2.jpg', name: 'Gorsuch' },
	{ src: '/assets/judges/Kavanaugh 12221_005_crop.jpg', name: 'Kavanaugh' },
	{ src: '/assets/judges/Barrett_102535_w151.jpg', name: 'Barrett' },
	{ src: '/assets/judges/KBJackson3.jpg', name: 'Jackson' },
];

const FEATURES = [
	{
		num: '01',
		title: 'Research',
		desc: 'Study the case history, review precedents, and write your brief with AI-assisted research tools.',
	},
	{
		num: '02',
		title: 'Argue',
		desc: 'Face nine justices with distinct judicial philosophies — textualist, pragmatist, civil libertarian, and more.',
	},
	{
		num: '03',
		title: 'Ruling',
		desc: 'Receive a full opinion: majority, concurrences, and dissents. Every ruling earned on the merits.',
	},
];

const BENCH_PREVIEW = [
	{ src: '/assets/judges/Roberts_8807-16_Crop.jpg', name: 'Roberts', philosophy: 'Institutionalist' },
	{ src: '/assets/judges/Thomas_9366-024_Crop.jpg', name: 'Thomas', philosophy: 'Originalist' },
	{ src: '/assets/judges/Alito_9264-001-Crop.jpg', name: 'Alito', philosophy: 'Originalist' },
	{ src: '/assets/judges/Sotomayor_Official_2025.jpg', name: 'Sotomayor', philosophy: 'Living Const.' },
	{ src: '/assets/judges/Kagan_10713-017-Crop.jpg', name: 'Kagan', philosophy: 'Pragmatist' },
	{ src: '/assets/judges/Gorsuch2.jpg', name: 'Gorsuch', philosophy: 'Textualist' },
	{ src: '/assets/judges/Kavanaugh 12221_005_crop.jpg', name: 'Kavanaugh', philosophy: 'Institutionalist' },
	{ src: '/assets/judges/Barrett_102535_w151.jpg', name: 'Barrett', philosophy: 'Textualist' },
	{ src: '/assets/judges/KBJackson3.jpg', name: 'Jackson', philosophy: 'Living Const.' },
];

const Home = () =>
{
	return (
		<main className='flex flex-col min-h-screen'>
			<section
				className='relative flex flex-col items-center justify-center min-h-screen text-white px-6 py-24'
				style={{ background: 'oklch(0.13 0.015 265)' }}
			>
				<div className='flex flex-col items-center gap-4 mb-8 text-center'>
					<p className='text-xs tracking-[0.3em] uppercase text-white/50 font-medium'>
						Supreme Court of the United States
					</p>
					<div className='w-24 h-px bg-white/20' />
					<h1 className='font-heading text-7xl md:text-8xl font-bold text-white leading-none tracking-tight'>
						Courtly
					</h1>
					<p className='text-lg text-white/70 max-w-lg text-center italic' style={{ fontFamily: 'var(--font-sans)' }}>
						Argue before a nine-justice AI panel. Every claim challenged. Every weakness exposed. Every ruling earned.
					</p>
				</div>

				<div className='w-full max-w-2xl h-px bg-white/10 mb-8' />

				<div className='w-full flex justify-center mb-8' style={{ perspective: '900px' }}>
					<div
						className='relative w-full max-w-2xl'
						style={{ height: '140px', transform: 'rotateX(14deg)', transformStyle: 'preserve-3d' }}
					>
						{JUDGES.map((judge, i) =>
						{
							const t = i / 8;
							const xPct = 4 + 92 * t;
							const yPct = 72 - 32 * 4 * t * (1 - t);
							return (
								<div
									key={judge.name}
									className='absolute'
									style={{ left: `${xPct}%`, top: `${yPct}%`, transform: 'translate(-50%, -50%)' }}
								>
									<div className='w-14 h-14 rounded-full overflow-hidden ring-1 ring-white/30 shadow-lg shadow-black/50'>
										<Image
											src={judge.src}
											alt={judge.name}
											width={56}
											height={56}
											className='w-full h-full object-cover object-top'
										/>
									</div>
								</div>
							);
						})}
					</div>
				</div>

				<div className='w-px h-10 bg-white/15 mb-2' />

				<div className='flex flex-col items-center gap-4'>
					<div className='flex flex-col sm:flex-row gap-3'>
						<Link
							href='/auth/login?screen_hint=signup&returnTo=/dashboard'
							className='inline-flex items-center justify-center rounded-sm bg-white text-black px-8 py-3 text-sm font-semibold hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors'
						>
							Create Account →
						</Link>
						<Link
							href='/auth/login?returnTo=/dashboard'
							className='inline-flex items-center justify-center rounded-sm border border-white/40 px-8 py-3 text-sm font-semibold text-white hover:border-white/70 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-colors'
						>
							Sign In
						</Link>
					</div>
					<Link
						href='/dashboard'
						className='text-sm text-white/40 hover:text-white/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 rounded transition-colors'
					>
						Continue as guest
					</Link>
				</div>
			</section>

			<section className='bg-background py-24 px-6'>
				<div className='max-w-4xl mx-auto'>
					<div className='grid grid-cols-1 md:grid-cols-3 gap-12'>
						{FEATURES.map(f => (
							<div key={f.num} className='flex flex-col gap-4 border-l-2 border-border pl-6'>
								<span className='font-heading text-4xl font-bold text-muted-foreground/20'>
									{f.num}
								</span>
								<h2 className='font-heading text-xl font-bold text-foreground'>
									{f.title}
								</h2>
								<p className='text-sm text-muted-foreground leading-relaxed'>
									{f.desc}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			<div className='w-full px-6 py-16 border-t border-border'>
				<div className='max-w-4xl mx-auto'>
					<p className='label-caps text-muted-foreground mb-8 text-center'>The Bench</p>
					<div className='grid grid-cols-3 md:grid-cols-9 gap-6 justify-items-center'>
						{BENCH_PREVIEW.map(j => (
							<div key={j.name} className='flex flex-col items-center gap-2'>
								<div className='w-12 h-12 rounded-full overflow-hidden ring-1 ring-border'>
									<Image src={j.src} alt={j.name} width={48} height={48} className='w-full h-full object-cover object-top' />
								</div>
								<span className='text-[10px] text-muted-foreground text-center font-medium'>{j.philosophy}</span>
							</div>
						))}
					</div>
				</div>
			</div>
		</main>
	);
};

export default Home;
