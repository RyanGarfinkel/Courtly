import re

from app.clients.courtlistener import CourtListenerClient


def _slugify(name: str) -> str:
	return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _strip_html(text: str) -> str:
	return re.sub(r"<[^>]+>", "", text).strip()


def run(query: str, limit: int = 9) -> list[dict]:
	client = CourtListenerClient()
	try:
		results = client.search_opinions(query, court="scotus", limit=limit)
		cases = []
		for r in results:
			name = r.get("caseName", "").strip()
			if not name:
				continue
			date_filed = r.get("dateFiled", "")
			year = 0
			if date_filed:
				try:
					year = int(date_filed[:4])
				except ValueError:
					pass
			citations = r.get("citation", [])
			snippet = _strip_html(r.get("snippet", "").strip())
			url = r.get("absolute_url", "")
			cases.append({
				"id": _slugify(name),
				"name": name,
				"year": year,
				"category": "SCOTUS",
				"summary": snippet or "No summary available.",
				"citation": citations[0] if citations else "",
				"url": f"https://www.courtlistener.com{url}" if url else "",
				"source": "courtlistener",
			})
		return cases
	finally:
		client.close()
