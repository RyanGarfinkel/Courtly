export interface Citation
{
	case_name: string;
	citation: string | null;
	court: string | null;
	year: number | null;
	url: string | null;
}

export interface LegalSource
{
	citation: Citation;
	relevant_quote: string;
	relevance_explanation: string;
}
