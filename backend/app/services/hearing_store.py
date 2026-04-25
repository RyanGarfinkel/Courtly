from app.models.hearing import HearingState
from pathlib import Path
import json

_STORE_PATH = Path(__file__).parent.parent.parent / 'data' / 'hearings.json'


def _load() -> dict:
	if not _STORE_PATH.exists():
		return {}
	try:
		return json.loads(_STORE_PATH.read_text())
	except (json.JSONDecodeError, OSError):
		return {}


def _save(data: dict) -> None:
	_STORE_PATH.parent.mkdir(exist_ok=True)
	_STORE_PATH.write_text(json.dumps(data))


def create(state: HearingState) -> None:
	data = _load()
	data[state.hearing_id] = state.model_dump()
	_save(data)


def get(hearing_id: str) -> HearingState | None:
	raw = _load().get(hearing_id)
	if raw is None:
		return None
	return HearingState(**raw)


def update(state: HearingState) -> None:
	create(state)
