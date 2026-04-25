from pydantic import BaseModel


class Citation(BaseModel):
    case_name: str
    citation: str | None
    court: str | None
    year: int | None
    url: str | None


class LegalSource(BaseModel):
    citation: Citation
    relevant_quote: str
    relevance_explanation: str
