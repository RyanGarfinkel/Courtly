from app.clients.mongo import get_db
from app.models.hearing import HearingState


def create(state: HearingState) -> None:
	get_db()["hearings"].replace_one(
		{"hearing_id": state.hearing_id},
		state.model_dump(),
		upsert=True,
	)


def get(hearing_id: str) -> HearingState | None:
	doc = get_db()["hearings"].find_one({"hearing_id": hearing_id}, {"_id": 0})
	if doc is None:
		return None
	return HearingState(**doc)


def update(state: HearingState) -> None:
	create(state)
