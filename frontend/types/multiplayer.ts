import { HearingRuling } from './hearing';

export interface MatchPlayer
{
	user_id: string;
	user_name: string;
	hearing_id: string | null;
	status: 'pending' | 'in_progress' | 'concluded';
	ruling: HearingRuling | null;
}

export interface MultiplayerMatch
{
	match_id: string;
	case_id: string;
	case_name: string;
	status: 'waiting' | 'active' | 'concluded';
	created_at: string;
	plaintiff: MatchPlayer | null;
	defendant: MatchPlayer | null;
}
