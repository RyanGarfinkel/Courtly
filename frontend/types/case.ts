export interface Case
{
	id: string;
	name: string;
	year: number;
	category: string;
	summary: string;
	citation: string;
	court_listener_link?: string;
	panel?: string[] | null;
}
