# AGENTS.md

## Frontend Tasks

Frontend code lives in `frontend/`. When working on any frontend code (components, pages, UI), follow the instructions in [.github/instructions/frontend.md](.github/instructions/frontend.md).

## Backend Tasks

Backend code lives in `backend/`. When working on any backend code, follow the instructions in [.github/instructions/backend.md](.github/instructions/backend.md).

## Infrastructure

Hosting and external platform details are documented in [.github/instructions/infra.md](.github/instructions/infra.md).

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

### 5. Judicial Panel (9 Judge Agents)

The panel replaces a single judge. All 9 agents are instances of the same `JudgeAgent` initialized with a distinct judicial philosophy. They vote independently — majority rules.

Each judge produces:
- `vote`: `for` | `against` | `abstain`
- `opinion`: reasoning grounded in their philosophy
- `opinion_type`: `majority` | `concurrence` | `dissent`

The panel orchestrator tallies votes and designates the majority opinion author, any concurrences, and dissents.

#### The Nine

| # | Name | Philosophy |
|---|------|------------|
| 1 | **Justice Hale** | Textualist — interprets law by the plain meaning of the text at time of enactment |
| 2 | **Justice Okafor** | Original Intent — seeks the framers' purpose behind the law |
| 3 | **Justice Voss** | Living Constitutionalist — the constitution evolves with society |
| 4 | **Justice Crane** | Pragmatist — weighs real-world consequences over doctrinal purity |
| 5 | **Justice Mirande** | Civil Libertarian — strong presumption toward individual rights |
| 6 | **Justice Ashworth** | Structuralist — focuses on separation of powers and federalism |
| 7 | **Justice Lim** | Precedent-First — heavily weights stare decisis, resistant to overturning settled law |
| 8 | **Justice Ndidi** | Natural Law — grounds decisions in fundamental moral principles |
| 9 | **Justice Solis** | Balancing Test — applies proportionality, weighs competing state and individual interests |

#### Panel Outputs
- **Ruling**: majority vote (5+ judges)
- **Confidence**: margin of the vote (9-0 = highest, 5-4 = lowest)
- **Majority opinion**: written by the judge whose reasoning best represents the majority
- **Concurrences**: same vote, different reasoning
- **Dissents**: opposing votes with full reasoning
- **Swing analysis**: which judge(s) were closest to flipping

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