from app.clients.backboard import BackboardClient
from pathlib import Path
import json
import os

_DATA_DIR = Path(__file__).parent.parent.parent / "data"
_THREADS_FILE = _DATA_DIR / "threads.json"


def _client_ready() -> bool:
	return bool(os.environ.get("BACKBOARD_API_KEY") and os.environ.get("BACKBOARD_ASSISTANT_ID"))


def _load_threads() -> dict:
	if not _THREADS_FILE.exists():
		return {}
	try:
		return json.loads(_THREADS_FILE.read_text())
	except Exception:
		return {}


def _save_threads(data: dict) -> None:
	_DATA_DIR.mkdir(exist_ok=True)
	_THREADS_FILE.write_text(json.dumps(data, indent=2))


def get_or_create_thread(case_id: str) -> str | None:
	if not _client_ready():
		return None
	threads = _load_threads()
	if case_id in threads:
		return threads[case_id]
	try:
		thread_id = BackboardClient().create_thread(os.environ["BACKBOARD_ASSISTANT_ID"])
		threads[case_id] = thread_id
		_save_threads(threads)
		return thread_id
	except Exception:
		return None


def _parse_meta(raw) -> dict:
	if not raw:
		return {}
	if isinstance(raw, str):
		try:
			return json.loads(raw)
		except Exception:
			return {}
	return raw if isinstance(raw, dict) else {}


def save_research(case_id: str, sources: list) -> None:
	thread_id = get_or_create_thread(case_id)
	if not thread_id:
		return
	try:
		BackboardClient().add_message(
			thread_id,
			content=json.dumps(sources),
			send_to_llm=False,
			metadata={"type": "research", "case_id": case_id},
		)
	except Exception:
		pass


def get_cached_research(case_id: str) -> list | None:
	thread_id = get_or_create_thread(case_id)
	if not thread_id:
		return None
	try:
		thread = BackboardClient().get_thread(thread_id)
		for msg in reversed(thread.get("messages", [])):
			if _parse_meta(msg.get("metadata_")).get("type") == "research":
				return json.loads(msg["content"])
	except Exception:
		pass
	return None


def save_draft(case_id: str, content: str) -> None:
	thread_id = get_or_create_thread(case_id)
	if not thread_id:
		return
	try:
		BackboardClient().add_message(
			thread_id,
			content=content,
			send_to_llm=False,
			metadata={"type": "brief_draft", "case_id": case_id},
		)
	except Exception:
		pass


def get_latest_draft(case_id: str) -> str | None:
	thread_id = get_or_create_thread(case_id)
	if not thread_id:
		return None
	try:
		thread = BackboardClient().get_thread(thread_id)
		for msg in reversed(thread.get("messages", [])):
			if _parse_meta(msg.get("metadata_")).get("type") == "brief_draft":
				return msg["content"]
	except Exception:
		pass
	return None
