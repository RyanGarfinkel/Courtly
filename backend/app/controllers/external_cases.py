import math
from fastapi import APIRouter, Query

from app.agents import retriever

router = APIRouter(prefix="/external-cases", tags=["external-cases"]) 


@router.get("")
def external_cases(
    q: str = Query(..., description="Query to search across Supreme Court opinions"),
    page: int | None = Query(default=1, ge=1, description="Page number of external results"),
    limit: int | None = Query(default=5, ge=1, le=20, description="Number of results per page"),
):
    # offset into courtlistener results
    page_number = page or 1
    page_size = limit or 5
    offset = (page_number - 1) * page_size

    sources = retriever.run(q, limit=page_size, offset=offset)

    # Return serialized LegalSource objects
    return {
        "results": [s.dict() for s in sources],
        "page": page_number,
        "page_size": page_size,
    }
