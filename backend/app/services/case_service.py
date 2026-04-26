from app.clients.courtlistener import CourtListenerClient
from concurrent.futures import ThreadPoolExecutor
from app.clients.gemini import GeminiClient
from app.clients.mongo import get_db
import hashlib
import re

EXPAND_WORKERS = 3


def _case_id(name: str) -> str:
    return hashlib.sha1(name.lower().strip().encode()).hexdigest()[:10]


def _expand_summary(name: str, snippet: str) -> str:
    prompt = f"""Summarize the US Supreme Court case "{name}" in 3-4 paragraphs.
Cover: the facts and background, the central legal question, the Court's holding, and the broader significance.
Write in clear informative prose. No headers or bullet points.
Context from the opinion: {snippet}"""
    try:
        return GeminiClient().generate(prompt)
    except Exception:
        return snippet


def _map_cl(result: dict, override_id: str | None = None, cl: CourtListenerClient | None = None, expand: bool = True) -> dict | None:
    name = result.get("caseName", "").strip()
    if not name:
        return None
    year = None
    if result.get("dateFiled"):
        try:
            year = int(result["dateFiled"][:4])
        except ValueError:
            pass
    citations = result.get("citation", [])
    snippet = re.sub(r"<[^>]+>", "", result.get("snippet", "")).strip()
    raw_url = result.get("absolute_url", "")

    judge_str = result.get("judge", "") or ""
    if not judge_str and raw_url and cl:
        panel = cl.get_cluster_judges(raw_url)
    else:
        names = [n.strip() for n in judge_str.split(",") if n.strip()]
        panel = names or None

    return {
        "id": override_id or _case_id(name),
        "name": name,
        "year": year,
        "category": result.get("suitNature") or "Supreme Court",
        "summary": _expand_summary(name, snippet) if expand else snippet,
        "citation": citations[0] if citations else "",
        "court_listener_link": f"https://www.courtlistener.com{raw_url}" if raw_url else None,
        "panel": panel,
    }


def _cl_search(query: str, limit: int = 5) -> list[dict]:
    cl = CourtListenerClient()
    try:
        results = cl.search_opinions(query, limit=limit)
        cases = [c for r in results if (c := _map_cl(r, cl=cl, expand=False))]

        def _expand(case: dict) -> dict:
            case["summary"] = _expand_summary(case["name"], case["summary"])
            return case

        with ThreadPoolExecutor(max_workers=EXPAND_WORKERS) as pool:
            cases = list(pool.map(_expand, cases))

        cases = list({c["id"]: c for c in cases}.values())

        col = get_db()["cases"]
        for c in cases:
            col.replace_one({"id": c["id"]}, c, upsert=True)
        return cases
    finally:
        cl.close()


def _seed_if_empty() -> None:
    if get_db()["cases"].count_documents({}) == 0:
        from app.seed import run
        run()
