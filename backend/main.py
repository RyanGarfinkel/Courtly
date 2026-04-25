import os

from dotenv import load_dotenv
from courtlistener import CourtListener
from fastapi import FastAPI

load_dotenv()

test = CourtListener(api_token=os.getenv("COURTLISTENER_API_KEY"))

app = FastAPI(title="Courtly API")


@app.get("/health")
def health():
    return {"status": "ok"}
