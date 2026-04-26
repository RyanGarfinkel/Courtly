# AGENTS.md

## Frontend Tasks

Frontend code lives in `frontend/`. When working on any frontend code (components, pages, UI), follow the instructions in [.github/instructions/frontend.md](.github/instructions/frontend.md).

## Backend Tasks

Backend code lives in `backend/`. When working on any backend code, follow the instructions in [.github/instructions/backend.md](.github/instructions/backend.md).

## Infrastructure

Hosting and external platform details are documented in [.github/instructions/infra.md](.github/instructions/infra.md).

---

## Overview

This project implements an **Adversarial AI Legal Decision Engine** that puts the user at the lectern of a simulated Supreme Court. They research a case, write a brief, argue before a panel of 9 AI judges with distinct philosophies, survive cross-examination, and receive a binding ruling with full opinions.

The system is **not a chatbot**. It is a structured, multi-agent pipeline that simulates the adversarial pressure of oral argument — not a Q&A loop.

---

## Development Principle: Never Hardcode Case Data

Case content — summaries, citations, panels, categories, years — must **never** be hardcoded in source files. CourtListener is the authoritative source for all case data. `seed.py` may contain a list of case *names* to look up, but all case content must be fetched from CourtListener and stored in MongoDB. If you find yourself writing a case summary, citation, or judge list inline, stop and fetch it instead.

## Development Principle: Always Use Agents

When implementing any feature that involves AI reasoning, analysis, classification, summarization, or decision-making — **implement it as a stateless agent function in `backend/app/agents/`**, not as inline logic in controllers or services. Controllers handle HTTP only. Services orchestrate. Agents do the thinking.

If a task could be done by an LLM, it should be done by an agent.

## Development Principle: Parallelize Agent Work

When using AI coding agents (Claude Code subagents, etc.) to implement features, **always run independent workstreams in parallel**. Never sequence tasks that don't have hard dependencies on each other.

Typical parallel splits:
- Backend implementation and frontend scaffolding can run simultaneously once the API contract is defined
- Judge/persona prompt writing is always independent and should run in its own agent
- Model definitions, controller logic, and orchestrator logic can often be parallelized across separate agents

Write the API contract (request/response shapes) before spawning agents — that shared contract is the only dependency. Once it exists, backend and frontend agents can proceed simultaneously.

---

## Core Principles

- Every claim must be **grounded in evidence**
- Every argument must be **attackable**
- Weak reasoning must be **rejected, not summarized**
- Outputs must end in a **decision**, not a description

---

## What's Been Built

### Agent Layer
- **`brief_writer`** — drafts a structured legal brief from case facts and chosen side
- **`case_discovery`** — surfaces relevant SCOTUS precedents from CourtListener
- **`case_search`** — searches for cases by keyword or topic
- **`retriever`** — retrieves ranked legal sources and citations
- **`judge`** — 9 instances parameterized by judicial philosophy; asks questions, scores responses, reacts, and deliberates
- **`opposing_counsel`** — argues the opposing side after user examination, responds to judge questions
- **`scorer`** — evaluates the user's full argument on consistency, precedent, and responsiveness
- **`stress_test`** — scores a draft response before submission on relevance, legal strength, consistency, and clarity
- **`hearing_assistant`** — law clerk agent that provides research help during oral argument

### Orchestration
- **`hearing` orchestrator** — drives the full hearing pipeline: start → interrogation turns → opposing counsel arguments → rebuttal → deliberation → ruling
- Disposition scores tracked per judge throughout, influence final vote
- Swing justice identification on ruling

### Frontend
- **Dashboard** — case grid with active cases
- **Case overview** — case summary with side selection (plaintiff/defendant), brief workspace
- **Brief workspace** — AI panel, research panel, brief editor
- **Hearing room** — full oral argument interface:
  - `CourtIntro` — pre-argument staging screen with bench layout and oyez ceremony
  - `BenchHeader` — 9 justice avatars with active/spoken state
  - `Bubble` — message rendering with judge philosophy labels
  - `ResponseStudio` — draft input with stress test and hint tools
  - `AssistantPanel` — law clerk research panel
  - `RulingPanel` — result, score bars, majority opinion, concurrences, dissents, swing justices

### Data Storage
- **MongoDB** is the primary runtime data store — all case lookups hit the `cases` collection first
- On first request to `GET /cases/popular`, `seed.py` auto-populates the `cases` collection with preset cases and resolves `court_listener_link` for each via CourtListener
- Case schema: `id`, `name`, `year`, `category`, `summary`, `citation`, `court_listener_link?`
- Search (`GET /cases`): checks MongoDB regex match first; falls back to CourtListener for new results and upserts them
- Popular (`GET /cases/popular`): samples from MongoDB `$sample`; falls back to JSON only if collection is empty
- Custom cases created via `POST /cases` are written directly to MongoDB

### Auth
- Auth0 via `@auth0/nextjs-auth0` v4 on frontend, python-jose on backend
- Route protection in place

---

## What Makes It Feel Like an AI Wrapper (Problems to Solve)

These are the specific signals that make the product feel like a chatbot in disguise rather than a courtroom simulation. Fix these in priority order.

### 1. Chat Bubble Transcript (Critical)
The main interaction renders as a back-and-forth bubble chat — the same visual language as every AI chatbot. Real oral arguments are NOT chat. The attorney stands at a lectern. The bench is elevated and formal. The visual metaphor must change.

**Fix**: Replace the bubble transcript with a **spatial courtroom layout**. The bench lives at the top of the screen — 9 seats, the active justice slightly foregrounded. The lectern is at the bottom — the user's input area. Messages from the bench render as bench pronouncements, not chat bubbles.

### 2. Questions Appear Instantly (High)
A full paragraph of text from a judge snaps into existence the moment a turn resolves. This feels like text being pasted, not a person speaking.

**Fix**: Stream judge questions via SSE. Characters arrive at reading speed (~40ms/char). The effect is transformative — it reads like someone is formulating their thought live. This is the single highest-ROI change in the product.

### 3. Strict Q→A Ping-Pong (High)
The current flow is: judge asks → user answers → next judge asks. Real oral arguments are chaotic. Justices interrupt. A justice who was satisfied with your answer on turn 1 may cut back in on turn 3 because your turn 2 answer contradicted turn 1.

**Fix**: After a user submits, add a **press mechanic** — 40% chance the same judge interjects with a follow-up before the next justice takes over: *"Counsel, you didn't answer what I asked. I asked specifically about..."*. This breaks the ping-pong pattern and creates real pressure.

### 4. Judges Don't Talk to Each Other (High)
The bench is nine isolated bots. In reality, justices react to each other's questions, push back on each other's framing, and signal their coalition to each other during argument.

**Fix**: Between turns (after a user answers and before the next judge speaks), inject a **bench aside** — a 1–2 line exchange between two non-active judges that the user "overhears." Example: *"Justice Voss: I find the precedent question more troubling than counsel admits. Justice Lim: Agreed — their reading of Chevron is creative."* These require no user response. They are atmosphere and signal.

### 5. Input Box Visible at All Times (Medium)
The response textarea is always visible and always editable. This is a chatbot affordance. You should not be able to "speak" whenever you want — you speak when the bench addresses you.

**Fix**: Hide the input until a judge has finished their question. When the question finishes streaming, the input area animates in from below. This creates the experience of being called upon to speak.

### 6. "Get Hint" Button (Medium)
The most visible AI-wrapper crutch. It says: *this is a tool that generates content for you.* It undermines the simulation.

**Fix**: Remove it. Replace with a proactive law clerk that surfaces intelligence *before* the user needs to ask: which precedent the judge just invoked, which of the user's brief arguments are under attack, which judges are wavering on their disposition. The clerk shows, it doesn't ghost-write.

### 7. Ruling Dumps All at Once (Medium)
All 9 votes, opinions, concurrences, and dissents appear simultaneously. Real SCOTUS decisions are announced sequentially. The Chief Justice reads the result. The majority author reads the opinion. Dissents are read aloud with weight.

**Fix**: Sequential vote reveal. See the **Ruling Ceremony** section below.

### 8. Static Bench Header (Low)
The 9 justice avatars indicate active/spoken but don't feel alive.

**Fix**: Subtle disposition coloring — a justice whose score has moved strongly in the user's favor has a slightly warmer tone; one leaning against is slightly cooler. When a justice is actively generating their question, their avatar pulses (not a spinner — a slow heartbeat-like scale animation). When a justice is about to speak, their avatar "leans forward" with a 2px translateY before the text begins.

---

## The Hearing Room Vision

### Spatial Layout
```
┌─────────────────────────────────────────────────┐
│  SUPREME COURT OF THE UNITED STATES              │
│                                                  │
│  [Hale] [Okafor] [Voss] [Crane] [Mirande]       │  ← The Bench (elevated, active state shown)
│       [Ashworth] [Lim] [Ndidi] [Solis]           │
│                                                  │
│  ─────────────────────────────────────────────  │
│                                                  │
│  Justice Hale: "Counsel, the text of the         │  ← Bench pronouncements (streaming in)
│  Commerce Clause does not contemplate..."        │
│                                                  │
│                                                  │
│                                                  │
│  ┌────────────────────────────────────────────┐  │
│  │  Your Honor, I respectfully submit...      │  │  ← Lectern (appears when bench finishes)
│  │                                            │  │
│  │                            [Address Court] │  │
│  └────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

The right panel (action panel) remains — but it becomes the **Clerk's Table**: proactive intelligence, not on-demand AI assistance.

### Streaming Architecture (SSE)
Add a `/hearing/stream-question` SSE endpoint. The judge agent generates to a stream; the frontend reads it with `EventSource`. Characters arrive at ~35ms intervals. When streaming ends, the input area animates in.

The existing `/hearing/turn` endpoint can stay for the response submission — only the *output* (judge questions) needs to stream.

### Bench Aside System
After a user submits a response and before the next judge's question, the orchestrator generates a brief bench exchange between 2 non-active judges (excluding the user's questioner). This is injected as two messages of type `aside`. Frontend renders asides as a subtle indented exchange, visually distinct from questions — smaller text, no input required.

Example agent prompt: *"You are two Supreme Court justices who just heard an attorney's answer. In 1–2 sentences total, react to what they said — to each other, not to the attorney. Be specific to their answer. You may agree, disagree, or flag a new concern."*

### Press Mechanic
After scoring a user response, if `score <= 0`, the orchestrator rolls (40% chance) to trigger a follow-up from the same judge before advancing the turn counter. The follow-up prompt: *"You asked X. The attorney said Y. You found it unsatisfying. In one sentence, press them on the specific gap — directly, from the bench."* This turn does NOT increment the turn counter.

---

## The Ruling Ceremony

Replace the instant dump in `RulingPanel` with a sequential reveal that treats the ruling as a dramatic moment.

### Phase 1: Conference
After rebuttal submits, show a "The Justices are in conference" screen. Subtle animation: the bench avatars dim and fade inward, suggesting the justices have retired. A slow pulsing indicator. 3 seconds of deliberation atmosphere before results load.

### Phase 2: Return to the Bench
The bench lights back up, one avatar at a time from the center outward (Chief Justice center). A short delay between each avatar appearing — the justices filing back.

### Phase 3: Swing Justice Spotlight
Before votes are shown: *"Justice Crane cast the deciding vote."* The swing justice's avatar pulses and enlarges briefly. One beat of silence.

### Phase 4: Vote Tally (Sequential)
Votes reveal one at a time, in order from most favorable to least. Each vote snaps in with a subtle sound-free animation. The running tally updates live: "5 — 2". The user watches the coalition form.

### Phase 5: Opinion Reading
The majority author's name appears first. Their opinion typewriters in. One beat. Then "Justice [Name] concurs" with their opinion. Finally dissents, with slightly different visual weight (muted, italic) — but still revealed one at a time.

---

## God-Tier Feature Backlog

These are features that would make the product stand alone as a platform, not a demo.

### 1. Judicial Record (Auth0 Justified)
Auth0 isn't just gatekeeping — it enables a **persistent judicial identity**. Every case the user argues is recorded against their account. The system tracks:
- Win/loss record overall and by case category (First Amendment, Commerce Clause, etc.)
- Per-justice disposition trends: "Justice Hale has ruled against you 3/3 times. Your textualist arguments are consistently weak."
- Doctrine strength profile: a radar chart showing consistency, precedent command, responsiveness across all cases argued
- Streak mechanics: consecutive wins, first win on a doctrine area

The dashboard becomes a war room, not a case list. Without auth, this is a one-shot demo. With auth, users come back.

### 2. Head-to-Head Mode
Two users argue the same case on opposite sides simultaneously. The same 9 judges evaluate both performances. At the end, the judges have heard both sides — not just one — and rule on the comparative quality of the arguments. This is the closest simulation to actual oral argument structure (each side gets 30 minutes) and creates a compelling competition mechanic.

### 3. Live Disposition Meter
During the hearing, a subtle heat map across the bench header shows each judge's running disposition in real time. As the user scores well, their warmth toward the user increases (warmer color on their avatar, 0.2s ease transition). As they score poorly, the avatar cools. This gives the user tactical feedback: they can see they're losing Hale but gaining Solis, and adjust their rhetoric accordingly.

This is **not gamification** — it's simulation. Real attorneys read the bench.

### 4. Judicial Interruption
A judge can interrupt the user's response mid-argument. Implementation: when the user submits, 20% of the time a different judge cuts in *before* the scoring judge reacts — a single pointed interjection: *"Counsel, before you continue — does your framework account for X?"* The user must address this before the main thread resumes. Creates chaos and realism.

### 5. Case Precedent Map
After each hearing, generate a **visual argument graph** showing the precedents cited (by user and by judges), which were accepted vs. challenged, and how they mapped to the final vote. Each node is a case; edges show "supports position" or "undermines position". This makes the outcome explainable — the user can see exactly which citations won or lost them the case.

### 6. Bench Mode (Spectator / Study)
Allow the user to watch a simulated full argument without participating — two AI attorneys argue both sides. The user observes the judicial dynamics, sees how the same judges react to different argument styles, and develops a feel for each justice's pressure points before arguing themselves. This is the "practice room" mode.

### 7. Brief Comparison
After a ruling, show the user's brief side-by-side with a "model brief" generated by the system — what an ideal argument for their side would have looked like given the actual judicial panel. Not a score — a mirror. *"You didn't invoke the dormant commerce clause doctrine. Justice Ashworth was watching for it."*

### 8. Moot Court History
Every argument is stored with full transcript. Users can share a read-only link to their case record: "Here is my argument in *Gonzales v. Raich* — 6-3 ruling in my favor." This is a social/portfolio mechanic that spreads the product organically and justifies auth.

---

## Auth0 Justification

Auth is not a login wall. It is the foundation of the identity layer that makes all of the above features possible:

- **Judicial Record** — win/loss tracking, doctrine strength profiles, per-justice disposition history
- **Saved briefs** — drafts persist across sessions, case work survives browser closes
- **Moot Court History** — every argument linked to an account, shareable transcripts
- **Head-to-Head Mode** — requires two authenticated users matched against each other
- **Competition / Leaderboard** — public rankings require verified identity

Without auth, the product resets on every visit. With auth, every session adds to a record that grows more valuable over time. The user is not just practicing law — they are building a judicial reputation.

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

### 6. Bench Aside Agent (New)
- Triggered: after each user response, before the next judge's question
- Input: two judge configs, user's answer, prior conversation
- Output: 2 messages — a short exchange between the two judges reacting to the answer
- Rendered as `type: aside` — displayed as an overheard bench conversation, no user response required

---

### 7. Press Agent (New)
- Triggered: when `score_response` returns <= 0 AND random roll fires (40%)
- Input: judge config, original question, user's insufficient answer
- Output: one follow-up question pressing the specific gap in the user's answer
- Does NOT advance the turn counter — same judge, same turn

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
```
