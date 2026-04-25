---
applyTo: ""
---

# Infrastructure

## Hosting
- **Vultr** — production hosting target

## AI Infrastructure
- **Backboard.io** — unified AI platform providing persistent threads, memory, RAG (hybrid BM25 + vector search), model routing, and web search via a single REST API
- No Python SDK — integrate via `requests` against `https://app.backboard.io/api`
- Core pattern: create an **Assistant** (system prompt) → create a **Thread** (persistent context) → send **Messages**
- Use cases in this project:
  - Persistent memory across case sessions (agents remember prior rulings, precedents, user preferences)
  - RAG over uploaded legal documents
  - Model routing to Gemini / Gemma if needed
- Client lives at `backend/app/clients/backboard.py`
- API key stored as `BACKBOARD_API_KEY` in `backend/.env`
- Docs: https://docs.backboard.io/
