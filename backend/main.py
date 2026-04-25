from app.controllers.retriever import router as retriever_router
from app.controllers.cases import router as cases_router
from dotenv import load_dotenv
from fastapi import FastAPI

load_dotenv()

app = FastAPI(title="Courtly API")

app.include_router(cases_router)
app.include_router(retriever_router)


@app.get("/health")
def health():
    return {"status": "ok"}
