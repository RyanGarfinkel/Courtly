import type { Metadata } from "next";
import { Playfair_Display, Lora, Geist_Mono } from "next/font/google";
import "./globals.css";

const playfairDisplay = Playfair_Display({
	variable: "--font-heading",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700", "800", "900"],
});

const lora = Lora({
	variable: "--font-sans",
	subsets: ["latin"],
	weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Courtly — Supreme Court Simulator",
	description: "Submit your case to a nine-justice AI panel. Every argument attacked, every claim verified, every ruling earned.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>)
{
	return (
		<html
			lang="en"
			className={`${playfairDisplay.variable} ${lora.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full flex flex-col">{children}</body>
		</html>
	);
}
