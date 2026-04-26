from app.controllers.external_cases import router as external_cases_router
from app.controllers.retriever import router as retriever_router
from app.controllers.research import router as research_router
from app.controllers.hearing import router as hearing_router
from app.controllers.cases import router as cases_router
from app.controllers.brief import router as brief_router
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pathlib import Path
from fastapi import FastAPI

load_dotenv(Path(__file__).parent / ".env")

app = FastAPI(title="Courtly API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(cases_router)
app.include_router(hearing_router)
app.include_router(brief_router)
app.include_router(research_router)
app.include_router(retriever_router)
app.include_router(external_cases_router)


@app.get("/health")
def health():
	return {"status": "ok"}
