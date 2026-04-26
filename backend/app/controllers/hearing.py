from app.agents.hearing_assistant import summarize as assist_summarize, answer_question as assist_answer, generate_hints
from app.services.hearing_store import create as store_create, get as store_get, update as store_update
from app.orchestrators.hearing import start as orchestrate_start, process_turn
from app.models.hearing import HearingMessage, HearingRuling
from fastapi import APIRouter, HTTPException
from app.agents.stress_test import analyze
from pydantic import BaseModel

router = APIRouter()


class StartRequest(BaseModel):
    case_id: str
    case_name: str
    case_summary: str
    brief: str
    side: str


class TurnRequest(BaseModel):
    hearing_id: str
    user_response: str


class AssistRequest(BaseModel):
    hearing_id: str
    question: str = ''


@router.post('/hearing/start')
def start_hearing(req: StartRequest):
    state, messages = orchestrate_start(
        req.case_id,
        req.case_name,
        req.case_summary,
        req.brief,
        req.side,
    )
    store_create(state)
    return {
        'hearing_id': state.hearing_id,
        'messages': [m.model_dump() for m in messages],
        'phase': state.phase,
        'turn': state.turn,
        'total_turns': state.total_turns,
    }


@router.post('/hearing/turn')
def hearing_turn(req: TurnRequest):
    state = store_get(req.hearing_id)
    if not state:
        raise HTTPException(status_code=404, detail='Hearing not found')

    state, new_messages, ruling = process_turn(state, req.user_response)
    store_update(state)

    return {
        'messages': [m.model_dump() for m in new_messages],
        'phase': state.phase,
        'turn': state.turn,
        'total_turns': state.total_turns,
        'ruling': ruling.model_dump() if ruling else None,
    }


@router.post('/hearing/assist')
def hearing_assist(req: AssistRequest):
    state = store_get(req.hearing_id)
    if not state:
        raise HTTPException(status_code=404, detail='Hearing not found')

    if req.question.strip():
        answer = assist_answer(req.question, state.messages, state.case_name, state.brief)
    else:
        answer = assist_summarize(state.messages, state.case_name, state.brief)

    return {'answer': answer}


class StressTestRequest(BaseModel):
    hearing_id: str
    question: str
    draft: str


@router.post('/hearing/stress-test')
def stress_test(req: StressTestRequest):
    state = store_get(req.hearing_id)
    if not state:
        raise HTTPException(status_code=404, detail='Hearing not found')
    result = analyze(req.question, req.draft, state.brief, state.case_name)
    return result


class HintRequest(BaseModel):
    hearing_id: str
    question: str


@router.post('/hearing/hint')
def get_hint(req: HintRequest):
    state = store_get(req.hearing_id)
    if not state:
        raise HTTPException(status_code=404, detail='Hearing not found')
    hints = generate_hints(req.question, state.messages, state.case_name, state.brief)
    return {'hints': hints}
