from app.services.case_memory import get_cached_research, save_research
from app.agents import retriever as retriever_agent
from fastapi import APIRouter

router = APIRouter()


@router.get("/research")
def get_research(case_id: str, q: str):
	cached = get_cached_research(case_id)
	if cached is not None:
		return cached

	sources = retriever_agent.run(q)
	sources_data = [s.model_dump() for s in sources]
	save_research(case_id, sources_data)
	return sources_data
