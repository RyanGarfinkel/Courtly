# AGENTS.md

## Frontend Tasks

Frontend code lives in `frontend/`. When working on any frontend code (components, pages, UI), follow the instructions in [.github/instructions/frontend.md](.github/instructions/frontend.md).

## Backend Tasks

Backend code lives in `backend/`. It is a Python FastAPI service with the following structure:

- `app/controllers/` — HTTP route handlers (FastAPI routers)
- `app/services/` — business logic
- `app/models/` — Pydantic models
- `app/agents/` — individual agent implementations (retriever, plaintiff, defense, etc.)
- `app/orchestrators/` — agent pipeline orchestration
- `main.py` — app entry point

Run with: `cd backend && .venv/bin/uvicorn main:app --reload`

---

## Overview

This project implements an **Adversarial AI Legal Decision Engine** that evaluates whether a case can withstand Supreme Court-level scrutiny.

The system is **not a chatbot**. It is a structured, multi-agent pipeline that:
1. Constructs arguments
2. Attacks them adversarially
3. Validates claims with evidence
4. Produces a defensible decision

---

## Core Principles

- Every claim must be **grounded in evidence**
- Every argument must be **attackable**
- Weak reasoning must be **rejected, not summarized**
- Outputs must end in a **decision**, not a description

---

## Agent Architecture

All agents are **stateless functions** operating over structured data.

### 1. Retriever Agent
- Input: case description
- Output: ranked legal sources (cases, statutes)
- Requirements:
  - MUST return citations
  - NO freeform reasoning

---

### 2. Plaintiff Agent
- Builds arguments supporting the case
- Output: structured claims
- Requirements:
  - Each claim must include supporting evidence

---

### 3. Defense Agent
- Attacks plaintiff claims
- Introduces counter-precedents
- Requirements:
  - Must directly target existing claims
  - No generic responses

---

### 4. Rhetoric Analyzer Agent
- Evaluates argument quality
- Flags:
  - unsupported claims
  - logical inconsistencies
  - weak structure

---

### 5. Judge Agent
- Final authority
- Responsibilities:
  - reject unsupported claims
  - penalize contradictions
  - produce ruling + confidence

---

### 6. (Optional) Witness / Expert Agents
- Domain-specific reasoning
- Must operate within strict scope
- Cannot introduce uncited claims

---

## Data Model

### Argument Graph

All reasoning is represented as a graph.

#### Node Types
- `claim`
- `evidence`

#### Edge Types
- `supports`
- `attacks`

#### Example

```json
{
  "id": "claim_1",
  "text": "...",
  "citations": ["case_123"],
  "supports": [],
  "attacked_by": ["claim_2"]
}