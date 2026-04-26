---
applyTo: "**/*.tsx,**/*.ts,**/app/**,**/components/**,**/pages/**"
---

# Frontend Instructions

## Framework
- Next.js (App Router)
- TypeScript

## Syntax
- Prefer single quotes for string literals in TypeScript and JavaScript code.
- Use double quotes only where the syntax requires it or when escaping would reduce readability.

## Component Library
- Use **shadcn/ui** components as the foundation for all UI elements
- Do not build custom primitives when a shadcn equivalent exists (Button, Input, Dialog, etc.)
- Extend shadcn components via `className` — do not override their internal styles directly

## Imports
- All imports go at the top of the file
- Ordered by statement length: **longest first, shortest last**
- No grouping by type — third-party and local imports are sorted together by length
- `'use client';` goes on line 1 (when required), followed by a blank line, then imports

## Interactivity
- Every interactive element must have explicit **focus** and **hover** states
- Use Tailwind classes: `hover:`, `focus:`, `focus-visible:` — prefer `focus-visible:` over `focus:` for keyboard accessibility
- Do not rely solely on browser defaults for focus rings — always define them explicitly

## Styling
- Tailwind CSS for all styling
- Follow shadcn's `cn()` utility for conditional class merging
- No inline `style` props unless absolutely necessary (e.g., dynamic values not expressible in Tailwind)
- **No hardcoded colors** — always use CSS variables (e.g., `bg-background`, `text-foreground`, `border-border`). Define all colors as variables in `globals.css` and reference them via Tailwind utilities or `var(--token-name)`

## Authentication
- Auth0 via `@auth0/nextjs-auth0` v4
- Auth client initialized in `lib/auth0.ts` using `Auth0Client` from `@auth0/nextjs-auth0/server` with explicit config
- Route protection via `proxy.ts` (Next.js 16 replacement for `middleware.ts`) — matcher covers `/auth/:path*` and protected routes
- Auth routes handled automatically by the SDK at `/auth/login`, `/auth/logout`, `/auth/callback`
- Access session on server components with `auth0.getSession()`
- Auth0 env vars: `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_DOMAIN`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`

## State Management & Contexts
- Use **React Context** (`createContext` + `useContext`) for state that is shared across multiple components in a subtree — e.g. the current user, the active case, editor state
- Create one context per domain concern; do not merge unrelated state into a single context
- Context providers live in `app/` or alongside the layout they serve; co-locate with their scope
- Keep context lean — only put in what genuinely needs to be shared; local state stays local
- Export a typed custom hook (e.g. `useCaseContext`) rather than exposing `useContext` directly

## Loading States
- Use **shadcn `Skeleton`** for all loading states — never use spinners or blank screens
- Mirror the shape of the content being loaded (e.g., a card skeleton should match the card's layout)
- Add skeletons wherever data is async: page-level fetches, API calls, deferred content

## File & Component Conventions
- One component per file
- File names: single word preferred; PascalCase for components, lowercase for pages/routes
- Component prop interfaces defined in the same file as the component
- Pages live in `app/` (App Router); reusable components live in `components/`
- Page-specific components co-located with the page, not in `components/`

## Code Quality
- **Reuse before creating** — search `components/` before building anything new. If it almost fits, extend it. Only create new if nothing close exists.
- **No dead code** — delete unused imports, variables, components, types, and branches immediately. Do not comment them out.
- **No hardcoded data** — no hardcoded IDs, user-facing content, or business values. System prompts and agent instruction strings are acceptable constants. All other runtime or environment-varying values must be externalized.
- **Clean code** — names should be self-explanatory. No unnecessary abstractions, no over-engineered solutions. Build what is needed now.
