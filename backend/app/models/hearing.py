from pydantic import BaseModel


class JudgeConfig(BaseModel):
	id: str
	name: str
	philosophy: str
	system_prompt: str


class HearingMessage(BaseModel):
	id: str
	speaker: str
	speaker_id: str
	content: str
	type: str


class JudgeVote(BaseModel):
	judge_id: str
	judge_name: str
	vote: str
	opinion_type: str
	opinion: str


class HearingScores(BaseModel):
	consistency: float
	precedent: float
	responsiveness: float
	overall: float


class HearingRuling(BaseModel):
	result: str
	vote_for: int
	vote_against: int
	majority_opinion: JudgeVote
	concurrences: list[JudgeVote]
	dissents: list[JudgeVote]
	scores: HearingScores
	swing_justices: list[str]


class HearingState(BaseModel):
	hearing_id: str
	case_id: str
	case_name: str
	case_summary: str
	brief: str
	side: str
	phase: str
	turn: int
	total_turns: int
	messages: list[HearingMessage]
	disposition_scores: dict[str, int]
	questioning_order: list[str]
