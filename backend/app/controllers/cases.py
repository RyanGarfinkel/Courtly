from pydantic import BaseModel
from fastapi import APIRouter, Query
from app.agents import case_discovery
from pathlib import Path
import math
import json
import re

router = APIRouter()

_PRESET_PATH = Path(__file__).parent.parent.parent / "config" / "cases.json"
_CUSTOM_PATH = Path(__file__).parent.parent.parent / "data" / "cases.json"


def _load_all() -> list:
	preset = json.loads(_PRESET_PATH.read_text())
	custom = json.loads(_CUSTOM_PATH.read_text()) if _CUSTOM_PATH.exists() else []
	return preset + custom


def _save_custom(cases: list) -> None:
	_CUSTOM_PATH.parent.mkdir(exist_ok=True)
	_CUSTOM_PATH.write_text(json.dumps(cases, indent=2))


def _matches(case: dict, query: str) -> bool:
	if not query:
		return True
	q = query.lower()
	return q in " ".join([
		case.get("name", ""),
		case.get("category", ""),
		case.get("summary", ""),
		case.get("citation", ""),
	]).lower()


def _slugify(name: str) -> str:
	return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


class CaseCreate(BaseModel):
	name: str
	summary: str
	category: str = "Custom"
	year: int = 0
	citation: str = ""


@router.get("/cases")
def get_cases(
	q: str | None = Query(default=None),
	page: int | None = Query(default=None, ge=1),
	limit: int | None = Query(default=None, ge=1, le=48),
):
	all_cases = _load_all()

	if q is None and page is None and limit is None:
		return all_cases

	filtered = [c for c in all_cases if _matches(c, q or "")]
	page_size = limit or 9
	page_num = page or 1
	total = len(filtered)
	total_pages = math.ceil(total / page_size) if total else 0

	if total_pages and page_num > total_pages:
		page_num = total_pages

	start = (page_num - 1) * page_size
	return {
		"cases": filtered[start:start + page_size],
		"query": q or "",
		"page": page_num,
		"page_size": page_size,
		"total_count": total,
		"total_pages": total_pages,
	}


@router.get("/cases/discover")
def discover_cases(q: str = Query(..., min_length=2)):
	return case_discovery.run(q)


@router.post("/cases")
def create_case(req: CaseCreate):
	all_cases = _load_all()
	existing_ids = {c["id"] for c in all_cases}

	base_id = _slugify(req.name)
	case_id, counter = base_id, 1
	while case_id in existing_ids:
		case_id = f"{base_id}-{counter}"
		counter += 1

	new_case = {
		"id": case_id,
		"name": req.name,
		"year": req.year,
		"category": req.category,
		"summary": req.summary,
		"citation": req.citation,
		"custom": True,
	}

	custom = json.loads(_CUSTOM_PATH.read_text()) if _CUSTOM_PATH.exists() else []
	custom.append(new_case)
	_save_custom(custom)
	return new_case
