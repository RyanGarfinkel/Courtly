---
applyTo: "**/*.tsx,**/*.ts,**/app/**,**/components/**,**/pages/**"
---

# Frontend Instructions

## Stack

- **Next.js 16** with App Router — all routing via `/app/` directory
- **React 19** — use Server Components by default; add `'use client'` only when you need interactivity, event handlers, or browser APIs
- **TypeScript** — strict typing throughout
- **Tailwind CSS v4** — utility-first styling
- **No separate backend** — everything is Next.js API routes under `/app/api/`

## Component Library

- Use **shadcn/ui** components as the foundation for all UI elements
- Do not build custom primitives when a shadcn equivalent exists (Button, Input, Dialog, etc.)
- shadcn components live in `/components/ui/`
- Extend shadcn components via `className` — do not override their internal styles directly

## Rich Text Editing

- **tiptap** is used for the brief workspace editor
- Editor is initialized in `workspace.tsx` via `useEditor` from `@tiptap/react`
- Extensions: `StarterKit`, `Placeholder` from `@tiptap/extension-placeholder`
- Content is parsed from markdown via `marked` before being set into the editor

## Authentication

- **Auth0 v4** via `@auth0/nextjs-auth0`
- Auth client initialized in `/lib/auth0.ts` using `Auth0Client` from `@auth0/nextjs-auth0/server`
- Access session on server components with `auth0.getSession()`
- Auth routes handled automatically by the SDK at `/auth/login`, `/auth/logout`, `/auth/callback`
- Auth0 env vars: `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`

## Data Storage

- **MongoDB** is the only database — accessed via `/lib/mongo.ts` `getDb()`
- Collections: `cases`, `hearings`, `multiplayer_matches`, `drafts`, `research`, `saved_cases`, `judges`
- All data access (MongoDB reads/writes) lives in `/lib/services/` — never inline in components or API routes

## AI / Gemini

- **Google Gemini** is the LLM — accessed via `/lib/gemini.ts` `generateText(prompt)`
- All agent AI logic lives in `/lib/agents/` — pure async functions, no inline AI in components or API routes
- Agent functions are stateless: they take inputs, call `generateText`, return typed outputs

## Directory Structure

```
/lib/agents/         — AI agent pure functions (one file per agent)
/lib/orchestrators/  — orchestration logic that coordinates multiple agents
/lib/services/       — all MongoDB data access (one file per domain)
/lib/gemini.ts       — Gemini client + generateText()
/lib/mongo.ts        — MongoDB connection
/lib/auth0.ts        — Auth0 client
/lib/seed.ts         — DB seeding logic
/lib/courtlistener.ts — CourtListener API client
/app/api/            — Next.js Route Handlers (HTTP only — no business logic)
/app/                — Pages following Next.js App Router conventions
/components/         — Shared reusable components
/components/ui/      — shadcn/ui primitives
/contexts/           — React Context providers (auth, case, etc.)
/types/              — TypeScript interfaces for domain concepts
```

## Layering Rules

- **API routes** (`/app/api/`): handle HTTP only — read request, validate, call service/orchestrator, return JSON. No business logic inline.
- **Services** (`/lib/services/`): all MongoDB reads and writes. Nothing else.
- **Agents** (`/lib/agents/`): all AI reasoning. Stateless functions. No DB access.
- **Orchestrators** (`/lib/orchestrators/`): coordinate agents and services into a pipeline.
- **Components**: render UI and call services/hooks. Never call AI directly.

## Types

- Hearing/judicial logic types: `/types/hearing.ts`
- Case types: `/types/case.ts`
- Multiplayer types: `/types/multiplayer.ts`
- Legal citation types: `/types/legal.ts`
- Component prop interfaces live in the same file as the component — not in `/types/`

## Imports

- All imports go at the top of the file
- Ordered by statement length: **longest first, shortest last**
- No grouping by type — third-party and local imports are sorted together by length
- `'use client';` goes on line 1 (when required), followed by a blank line, then imports

## Syntax

- Single quotes for all string literals in TypeScript and JSX attributes
- `const X = () => {}` for all functions — components, helpers, everything
- Opening brace on a new line for function/arrow function bodies
- No space between `if` and `(`: write `if(condition)` not `if (condition)`
- Tabs for indentation

## Interactivity

- Every interactive element must have explicit **focus** and **hover** states
- Use Tailwind: `hover:`, `focus-visible:` — always define focus rings explicitly, never rely on browser defaults
- Never use `outline: none` without a replacement

## Styling

- Tailwind CSS for all styling
- Use `cn()` from `/lib/utils.ts` for conditional class merging
- No inline `style` props unless the value is dynamic and not expressible in Tailwind
- No hardcoded colors — use CSS variables (`bg-background`, `text-foreground`, `border-border`, etc.)

## State Management

- React Context (`createContext` + `useContext`) for shared subtree state
- One context per domain concern — do not merge unrelated state
- Export a typed custom hook rather than exposing `useContext` directly
- Server state (fetching, caching): prefer React Query or SWR over manual `useState` management for complex cases

## Loading States

- Use **shadcn `Skeleton`** for all content loading states
- Mirror the shape of the content being loaded
- Add skeletons wherever data is async: page-level fetches, API calls, deferred content

## File & Component Conventions

- One component per file
- File names: single word preferred; lowercase for pages/routes
- Pages live in `/app/` (App Router)
- Shared reusable components: `/components/`
- Page-specific components: co-located with the page, not in `/components/`

## Code Quality

- Reuse before creating — search `/components/` before building anything new
- No dead code — delete unused imports, variables, components, types immediately
- No hardcoded data — no IDs, user-facing content, or business values in source. System prompt strings are acceptable constants.

## Design System

### Direction: "The Chamber"
The visual identity is institutional and editorial — not a SaaS app. Think *New York Times* crossed with the Library of Congress. Judicial gravity, editorial clarity, deliberate whitespace. Every page outside the hearing room is light-themed.

### Typography
- `font-heading` maps to **Playfair Display** (loaded via `--font-heading` CSS variable) — use on all `h1`, `h2`, case names, section stat numbers
- `--font-sans` maps to **Lora** — use for body reading text, editorial prose, italic quotes
- Apply with Tailwind: `font-heading` class or `style={{ fontFamily: 'var(--font-heading)' }}`

### Color Usage
- `--accent` is crimson (`oklch(0.40 0.14 15)`) — use ONLY for verdicts (affirmed/reversed), power moments. Never for decoration.
- `--primary` is dark navy — primary CTAs, active states
- `--background` is light cream — default for all browse/research pages
- The landing page hero uses `oklch(0.13 0.015 265)` directly as a dark background

### Border & Shape Conventions
- `rounded-sm` for all buttons, cards, badges, inputs — never `rounded-xl` or `rounded-2xl`
- `border border-border` for container borders — prefer borders over shadows
- No filled card backgrounds unless there is a strong reason — use `border` only containers

### Hover & Transition Conventions
- `transition-colors` or `transition-opacity` for interactive elements
- Scale transforms (`hover:scale-105`) only on small avatars and icons — never on page-level cards or buttons
- Left border accent on case rows: `bg-border` at rest → `bg-primary` on hover

### Utility Classes (defined in `globals.css`)
- `.animate-fade-in` — opacity/translateY fade in over 0.7s, with `prefers-reduced-motion` override
- `.section-rule` — 1px horizontal editorial divider with `margin: 2rem 0`
- `.case-headline` — Playfair Display, `clamp(1.75rem, 4vw, 3rem)`, `font-weight: 700`, `letter-spacing: -0.02em`
- `.label-caps` — `0.625rem` text, `letter-spacing: 0.25em`, uppercase, `font-weight: 600` — use for section labels, metadata headers

### Page Architecture
- **Landing** (`/`): dark hero section + light features section below the fold; no nav chrome
- **Dashboard** (`/dashboard`): `DashboardLayout` provides the nav header; page is light cream with editorial case rows
- **Case overview** (`/cases/[id]`): full-width serif headline, two-panel side selection (`/brief?side=plaintiff` / `?side=defendant`)
- **Brief** (`/cases/[id]/brief`): editor + collapsible right panel; "Enter the Courtroom →" primary CTA
- **Hearing room** (`/cases/[id]/hearing`): dark-themed, fully isolated — do not apply light-theme styles here
- **Transcript** (`/transcripts/[hearingId]`): official court document aesthetic; `.label-caps` labels, serif headings, score box with border
