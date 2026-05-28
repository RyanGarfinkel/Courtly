import { HearingMessage } from './hearing';

export interface HearingRecord
{
	record_id: string;
	user_id: string;
	hearing_id: string;
	case_id: string;
	case_name: string;
	case_year?: number;
	case_category?: string;
	side: 'plaintiff' | 'defendant';
	result: 'affirmed' | 'reversed';
	vote_for: number;
	vote_against: number;
	scores: {
		consistency: number;
		precedent: number;
		responsiveness: number;
		overall: number;
	};
	swing_justices: string[];
	messages: HearingMessage[];
	argued_at: string;
}

export interface JudicialStats
{
	total_cases: number;
	wins: number;
	losses: number;
	win_rate: number;
	avg_overall_score: number;
	avg_consistency: number;
	avg_precedent: number;
	avg_responsiveness: number;
	recent_records: HearingRecord[];
	by_category: Record<string, { wins: number; losses: number }>;
}
