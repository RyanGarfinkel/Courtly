from app.services.case_service import _case_id, _map_cl, _cl_search, _seed_if_empty
from app.clients.courtlistener import CourtListenerClient
from fastapi import APIRouter, Query
from app.clients.mongo import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/cases", tags=["cases"])


class CaseCreate(BaseModel):
    name: str
    summary: str
    category: str = "Custom"
    year: int = 0
    citation: str = ""


@router.get("/popular")
def get_popular(limit: int = Query(default=6, ge=1, le=24)):
    _seed_if_empty()
    col = get_db()["cases"]
    docs = list(col.aggregate([{"$sample": {"size": limit}}, {"$project": {"_id": 0}}]))
    return {"cases": docs}


@router.get("")
def get_cases(
    q: str | None = Query(default=None),
    page: int | None = Query(default=None, ge=1),
    limit: int | None = Query(default=None, ge=1, le=48),
    category: str | None = Query(default=None),
    name: str | None = Query(default=None),
    year_from: int | None = Query(default=None),
    year_to: int | None = Query(default=None),
    keyword: str | None = Query(default=None),
    exclude: str | None = Query(default=None),
):
    if not any([q, name, category, year_from, year_to, keyword]):
        return {"cases": [], "query": "", "page": 1, "page_size": limit or 5, "total_count": 0, "total_pages": 0}

    search_query = q or name or keyword or ""
    exclude_ids = set(exclude.split(",")) if exclude else set()
    n = limit or 5

    col = get_db()["cases"]
    mongo_results = list(col.find(
        {"name": {"$regex": search_query, "$options": "i"}},
        {"_id": 0},
        limit=n + len(exclude_ids),
    ))
    mongo_results = [c for c in mongo_results if c["id"] not in exclude_ids]

    if mongo_results:
        return {
            "cases": mongo_results[:n],
            "query": search_query,
            "page": page or 1,
            "page_size": n,
            "total_count": len(mongo_results),
            "total_pages": 1,
        }

    try:
        cases = _cl_search(search_query, limit=n + len(exclude_ids))
        cases = [c for c in cases if c["id"] not in exclude_ids][:n]
    except Exception as e:
        print(f"CourtListener search failed: {e}")
        cases = mongo_results

    return {
        "cases": cases,
        "query": search_query,
        "page": page or 1,
        "page_size": n,
        "total_count": len(cases),
        "total_pages": 1 if cases else 0,
    }


@router.get("/{case_id}")
def get_case_by_id(case_id: str):
    cached = get_db()["cases"].find_one({"id": case_id}, {"_id": 0})
    if cached:
        return cached

    try:
        cl = CourtListenerClient()
        try:
            results = cl.search_opinions(case_id.replace("-", " "), limit=1)
        finally:
            cl.close()
        if results:
            case = _map_cl(results[0], override_id=case_id, cl=cl)
            if case:
                get_db()["cases"].replace_one({"id": case_id}, case, upsert=True)
                return case
    except Exception as e:
        print(f"CourtListener lookup failed: {e}")

    return {"error": "Case not found"}, 404


@router.post("")
def create_case(req: CaseCreate):
    case_id = _case_id(req.name)
    existing = get_db()["cases"].find_one({"id": case_id}, {"_id": 0})
    if existing:
        return existing
    new_case = {
        "id": case_id,
        "name": req.name,
        "summary": req.summary,
        "category": req.category,
        "year": req.year,
        "citation": req.citation,
    }
    get_db()["cases"].insert_one({**new_case})
    return new_case
