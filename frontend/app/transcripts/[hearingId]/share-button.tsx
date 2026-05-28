'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';

const ShareButton = () =>
{
	const [copied, setCopied] = useState(false);

	const handleShare = async () =>
	{
		await navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<button
			onClick={handleShare}
			className='inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 px-3 py-1.5 rounded-md border border-border hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95'
		>
			<Share2 size={12} />
			{copied ? 'Link copied!' : 'Share transcript'}
		</button>
	);
};

export default ShareButton;
