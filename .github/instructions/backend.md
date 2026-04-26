---
applyTo: "backend/**"
---

# Backend Instructions

## Framework
- Python + FastAPI
- Pydantic v2 for all data models
- `python-dotenv` for environment variables

## Syntax
- Prefer single quotes for Python string literals.
- Use double quotes only where the syntax requires it or when escaping would reduce readability.

## Folder Structure

```
backend/
  app/
    agents/        # individual agent implementations (retriever, plaintiff, defense, etc.)
    clients/       # external API integrations (CourtListener, Gemini, MongoDB)
    controllers/   # FastAPI routers — HTTP only, no business logic
    dependencies/  # FastAPI dependencies (e.g. auth)
    models/        # Pydantic models
    orchestrators/ # agent pipeline orchestration
    services/      # business logic
    seed.py        # one-time DB seed — judges + preset cases with CourtListener links
  main.py          # app entry point — mounts routers, nothing else
  .env             # secrets (gitignored)
  .env.example     # checked-in template with empty values
```

## Layer Responsibilities

- **controllers** — handle HTTP concerns only (request parsing, response shaping, status codes). No logic.
- **services** — own business logic. Called by controllers.
- **orchestrators** — coordinate multi-agent pipelines. Called by services or directly by controllers.
- **agents** — stateless functions. Take structured input, return structured output. No HTTP concerns.
- **clients** — thin wrappers around external APIs (CourtListener, Gemini). No business logic.
- **models** — Pydantic models shared across layers. No logic in models.

## External Integrations

- **CourtListener** — case law retrieval via the `courtlistener-api-client` SDK. Client lives at `app/clients/courtlistener.py`. API key loaded from `COURTLISTENER_API_KEY` env var. Use `CourtListener(api_token=...)` as the entry point; endpoints support `.get(id)` and `.list(**filters)` with automatic pagination.
- **Gemini / Gemma** — LLM calls via `google-genai` SDK. Client lives at `app/clients/gemini.py`. API key loaded from `GEMINI_API_KEY` env var. Use Gemini for cloud inference, Gemma for open-weight model runs.
- **MongoDB** — primary persistence layer. Client lives at `app/clients/mongo.py`; `get_db()` returns the `courtly` database. Connection URI loaded from `MONGODB_URI` env var. Collections: `cases` (global case catalog), `judges` (judicial panel config), `hearings` (per-user hearing state).

## Authentication
- Auth0 JWT verification via `python-jose`
- Auth logic lives at `app/dependencies/auth.py` as a FastAPI dependency
- Protected routes declare the dependency: `user = Depends(get_current_user)`
- Verifies Bearer tokens against Auth0's JWKS endpoint at `https://{AUTH0_DOMAIN}/.well-known/jwks.json`
- Env vars: `AUTH0_DOMAIN`, `AUTH0_AUDIENCE`

## Environment Variables

- `.env` lives at `backend/.env` — never committed
- `.env.example` lives at `backend/.env.example` — always kept up to date with required keys (empty values)
- Load with `python-dotenv` via `load_dotenv()` in `main.py`

## Imports
- Ordered by statement length: **longest first, shortest last**
- No grouping by type — stdlib, third-party, and local imports sorted together by length

## Naming Conventions
- Files and directories: `snake_case`
- Classes: `PascalCase`
- Functions and variables: `snake_case`
- Constants: `UPPER_SNAKE_CASE`

## Running

```bash
cd backend
.venv/bin/uvicorn main:app --reload
```
