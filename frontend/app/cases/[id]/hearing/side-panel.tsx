'use client';

import React from 'react';

interface Props
{
	title: string;
	onClose: () => void;
	children: React.ReactNode;
}

export default function SidePanel({ title, onClose, children }: Props)
{
	return (
		<div className="flex flex-col h-full w-full bg-background">
			<div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
				<span className="text-sm font-semibold">{title}</span>
				<button
					onClick={onClose}
					className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
					aria-label="Close panel"
				>
					<svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
						<path d="M1 1l12 12M13 1L1 13" />
					</svg>
				</button>
			</div>
			<div className="flex-1 overflow-y-auto p-5">
				{children}
			</div>
		</div>
	);
}
