interface Props
{
	size?: number;
	className?: string;
}

const Logo = ({ size = 20, className }: Props) =>
{
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
			className={className}
		>
			<path d="M2 9.5 L12 3 L22 9.5 Z" />
			<rect x="3.5" y="10.5" width="3.5" height="9" rx="0.5" />
			<rect x="10.25" y="10.5" width="3.5" height="9" rx="0.5" />
			<rect x="17" y="10.5" width="3.5" height="9" rx="0.5" />
			<rect x="2" y="19.5" width="20" height="2.5" rx="0.5" />
		</svg>
	);
};

export default Logo;
