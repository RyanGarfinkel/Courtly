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
	vote: 'for' | 'against';
	opinion_type: 'majority' | 'concurrence' | 'dissent';
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
	result: 'affirmed' | 'reversed';
	vote_for: number;
	vote_against: number;
	majority_opinion: JudgeVote;
	concurrences: JudgeVote[];
	dissents: JudgeVote[];
	scores: HearingScores;
	swing_justices: string[];
}
