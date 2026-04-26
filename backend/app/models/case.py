from pydantic import BaseModel


class Case(BaseModel):
	id: str
	name: str
	year: int | None = None
	category: str
	summary: str
	citation: str
	court_listener_link: str | None = None
	panel: list[str] | None = None
