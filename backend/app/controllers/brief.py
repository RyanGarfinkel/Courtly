from app.agents.brief_writer import draft, expand_notes, strengthen, counterarguments
from app.services.case_memory import save_draft, get_latest_draft
from pydantic import BaseModel
from fastapi import APIRouter

router = APIRouter()


class DraftRequest(BaseModel):
	case_name: str
	case_summary: str = ""
	category: str = ""
	year: int = 0
	citation: str = ""
	user_notes: str = ""


class AssistRequest(BaseModel):
	content: str
	case_name: str
	case_summary: str = ""


class SaveDraftRequest(BaseModel):
	case_id: str
	content: str


@router.post("/brief/draft")
def draft_brief(req: DraftRequest):
	return {"result": draft(req.case_name, req.case_summary, req.category, req.year, req.citation, req.user_notes)}


@router.post("/brief/expand")
def expand_brief(req: AssistRequest):
	return {"result": expand_notes(req.content, req.case_name, req.case_summary)}


@router.post("/brief/strengthen")
def strengthen_brief(req: AssistRequest):
	return {"result": strengthen(req.content, req.case_name)}


@router.post("/brief/counter")
def counter_brief(req: AssistRequest):
	return {"result": counterarguments(req.content, req.case_name)}


@router.post("/brief/save-draft")
def save_brief_draft(req: SaveDraftRequest):
	save_draft(req.case_id, req.content)
	return {"saved": True}


@router.get("/brief/load-draft")
def load_brief_draft(case_id: str):
	return {"draft": get_latest_draft(case_id)}
