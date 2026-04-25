import json
import math
import os

from fastapi import APIRouter, Query

router = APIRouter(prefix="/cases", tags=["cases"])

CASES_PATH = os.path.join(os.path.dirname(__file__), "../../config/cases.json")


def _matches_case(case, query: str) -> bool:
    if not query:
        return True

    search_terms = " ".join([
        str(case.get("name", "")),
        str(case.get("category", "")),
        str(case.get("summary", "")),
        str(case.get("citation", "")),
    ]).lower()
    return query.lower() in search_terms



@router.get("")
def get_cases(
    q: str | None = Query(default=None, description="Case search query"),
    page: int | None = Query(default=None, ge=1, description="Page number"),
    limit: int | None = Query(default=None, ge=1, le=48, description="Cases per page"),
):
    with open(CASES_PATH) as f:
        cases = json.load(f)

    if q is None and page is None and limit is None:
        return cases

    filtered_cases = [case for case in cases if _matches_case(case, q or "")]
    page_size = limit or 9
    page_number = page or 1
    total_count = len(filtered_cases)
    total_pages = math.ceil(total_count / page_size) if total_count else 0
    start_index = (page_number - 1) * page_size
    end_index = start_index + page_size
    current_cases = filtered_cases[start_index:end_index]

    if total_pages and page_number > total_pages:
        page_number = total_pages
        start_index = (page_number - 1) * page_size
        end_index = start_index + page_size
        current_cases = filtered_cases[start_index:end_index]

    return {
        "cases": current_cases,
        "query": q or "",
        "page": page_number,
        "page_size": page_size,
        "total_count": total_count,
        "total_pages": total_pages,
    }
