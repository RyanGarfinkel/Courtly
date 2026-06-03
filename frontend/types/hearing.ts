export interface JudgeConfig
{
	id: string;
	name: string;
	short?: string;
	philosophy: string;
	system_prompt: string;
	image?: string;
}

export interface UIJudge
{
	id: string;
	name: string;
	short: string;
	philosophy: string;
	image?: string;
}

export interface BenchAside
{
	judge1_id: string;
	judge1_name: string;
	judge2_id: string;
	judge2_name: string;
	judge1_line: string;
	judge2_line: string;
}

export interface HearingMessage
{
	id: string;
	speaker: string;
	speaker_id: string;
	content: string;
	// type values: 'question' | 'statement' | 'argument' | 'rebuttal' | 'aside' | 'press'
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
	judge_ids: string[];
	case_year?: number;
	press_triggered?: boolean;
	match_id?: string;
}
