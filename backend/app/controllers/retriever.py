from app.agents import retriever
from fastapi import APIRouter, Query

router = APIRouter(prefix="/retriever", tags=["retriever"])


@router.get("/test")
def test_retriever(q: str = Query(..., description="Legal query to search for")):
    sources = retriever.run(q)
    return {"query": q, "results": [s.model_dump() for s in sources]}
