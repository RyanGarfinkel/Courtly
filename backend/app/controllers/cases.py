import json
import os

from fastapi import APIRouter

router = APIRouter(prefix="/cases", tags=["cases"])

CASES_PATH = os.path.join(os.path.dirname(__file__), "../../config/cases.json")


@router.get("")
def get_cases():
    with open(CASES_PATH) as f:
        return json.load(f)
