export interface JudgeConfig
{
	id: string;
	name: string;
	philosophy: string;
	system_prompt: string;
}

export interface HearingMessage
{
	id: string;
	speaker: string;
	speaker_id: string;
	content: string;
	type: string;
}

export interface JudgeVote
{
	judge_id: string;
	judge_name: string;
	vote: string;
	opinion_type: string;
	opinion: string;
}

export interface HearingScores
{
	consistency: number;
	precedent: number;
	responsiveness: number;
	overall: number;
}

export interface HearingRuling
{
	result: string;
	vote_for: number;
	vote_against: number;
	majority_opinion: JudgeVote;
	concurrences: JudgeVote[];
	dissents: JudgeVote[];
	scores: HearingScores;
	swing_justices: string[];
}

export interface CombinedRuling
{
	winner: 'plaintiff' | 'defendant';
	vote_plaintiff: number;
	vote_defendant: number;
	majority_opinion: JudgeVote;
	concurrences: JudgeVote[];
	dissents: JudgeVote[];
}

export interface HearingState
{
	hearing_id: string;
	case_id: string;
	case_name: string;
	case_summary: string;
	brief: string;
	side: string;
	phase: string;
	turn: number;
	total_turns: number;
	messages: HearingMessage[];
	disposition_scores: Record<string, number>;
	questioning_order: string[];
	match_id?: string;
}
