from app.clients.mongo import get_db
from datetime import datetime


def save_draft(case_id: str, content: str) -> None:
	get_db()["drafts"].replace_one(
		{"case_id": case_id},
		{"case_id": case_id, "content": content, "saved_at": datetime.utcnow()},
		upsert=True,
	)


def get_latest_draft(case_id: str) -> str | None:
	doc = get_db()["drafts"].find_one({"case_id": case_id}, {"_id": 0})
	return doc["content"] if doc else None


def save_research(case_id: str, sources: list) -> None:
	get_db()["research"].replace_one(
		{"case_id": case_id},
		{"case_id": case_id, "sources": sources, "cached_at": datetime.utcnow()},
		upsert=True,
	)


def get_cached_research(case_id: str) -> list | None:
	doc = get_db()["research"].find_one({"case_id": case_id}, {"_id": 0})
	return doc["sources"] if doc else None
