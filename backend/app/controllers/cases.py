import json
import math
import os
import random

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


from app.agents import case_search

@router.get("")
def get_cases(
    q: str | None = Query(default=None, description="Case search query"),
    page: int | None = Query(default=None, ge=1, description="Page number"),
    limit: int | None = Query(default=None, ge=1, le=48, description="Cases per page"),
    category: str | None = Query(default=None, description="Filter by category"),
    name: str | None = Query(default=None, description="Exact case name match"),
    year_from: int | None = Query(default=None, description="Minimum case year"),
    year_to: int | None = Query(default=None, description="Maximum case year"),
    keyword: str | None = Query(default=None, description="Keyword search"),
    exclude: str | None = Query(default=None, description="Comma-separated list of case IDs to exclude")
):
    # If no search/filter params provided, return empty
    if not any([q, name, category, year_from, year_to, keyword]):
        return {
            "cases": [],
            "query": "",
            "page": page or 1,
            "page_size": limit or 5,
            "total_count": 0,
            "total_pages": 0,
        }

    search_query = q or name or ""
    exclude_ids = exclude.split(",") if exclude else []
    
    # Use Gemini to search
    gemini_cases = case_search.search_cases(
        query=search_query,
        limit=limit or 5,
        category=category,
        year_from=year_from,
        year_to=year_to,
        exclude_ids=exclude_ids,
        keywords=keyword
    )

    # CRITICAL FALLBACK: If Gemini fails (e.g. 429 quota), use local data
    if not gemini_cases:
        try:
            with open(CASES_PATH) as f:
                all_local = json.load(f)
            
            def local_filter(c):
                if c["id"] in exclude_ids:
                    return False
                
                # If search_query is provided, it must match
                if search_query and not _matches_case(c, search_query):
                    return False
                
                # If keyword is provided, at least one keyword must match
                if keyword:
                    kws = [k.strip().lower() for k in keyword.split(",") if k.strip()]
                    if kws:
                        case_str = " ".join([str(v) for v in c.values()]).lower()
                        if not any(kw in case_str for kw in kws):
                            return False
                
                # Category filter
                if category and category.lower() not in str(c.get("category", "")).lower():
                    return False
                
                # Year filters
                if year_from and int(c.get("year", 0)) < int(year_from):
                    return False
                if year_to and int(c.get("year", 0)) > int(year_to):
                    return False
                
                return True
            
            gemini_cases = [c for c in all_local if local_filter(c)]
            # Manual limit for local fallback
            gemini_cases = gemini_cases[:(limit or 5)]
        except Exception as e:
            print(f"Fallback search failed: {e}")

    page_size = limit or 5
    page_number = page or 1
    total_count = len(gemini_cases)
    
    return {
        "cases": gemini_cases,
        "query": search_query,
        "page": page_number,
        "page_size": page_size,
        "total_count": total_count,
        "total_pages": 1 if total_count > 0 else 0,
    }


@router.get("/issues")
def get_issues():
    # Standard SCOTUS categories
    categories = [
        "First Amendment",
        "Second Amendment",
        "Due Process",
        "Equal Protection",
        "Commerce Clause",
        "Search and Seizure",
        "Criminal Procedure",
        "Civil Rights",
        "Executive Power",
        "Federalism",
        "Privacy",
        "Voting Rights"
    ]
    return {"issues": categories}


@router.get("/popular")
def get_popular(limit: int | None = Query(default=6, ge=1, le=24, description="Number of popular cases")):
    try:
        # Use Gemini to get landmark cases
        landmark_cases = case_search.get_popular_cases(limit=limit or 6)
        if not landmark_cases:
            raise ValueError("No cases from Gemini")
        return {"cases": landmark_cases}
    except Exception as e:
        print(f"Error in get_popular (Gemini): {e}. Falling back to local data.")
        try:
            with open(CASES_PATH) as f:
                cases = json.load(f)
            sample_size = min(len(cases), limit or 6)
            picked = random.sample(cases, sample_size)
            return {"cases": picked}
        except:
            return {"cases": []}


@router.get("/{case_id}")
def get_case_by_id(case_id: str):
    case = case_search.get_case_details(case_id)
    
    # Fallback to local if Gemini fails to find by ID
    if not case:
        try:
            with open(CASES_PATH) as f:
                cases = json.load(f)
            case = next((c for c in cases if c["id"] == case_id), None)
        except:
            pass

    if not case:
        return {"error": "Case not found"}, 404
    return case
