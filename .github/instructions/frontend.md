---
applyTo: "**/*.tsx,**/*.ts,**/app/**,**/components/**,**/pages/**"
---

# Frontend Instructions

## Framework
- Next.js (App Router)
- TypeScript

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
- Auth0 via `@auth0/nextjs-auth0`
- Auth route handler at `app/api/auth/[auth0]/route.ts` — handles all Auth0 callbacks, do not add logic here
- Wrap `app/layout.tsx` with `UserProvider` from `@auth0/nextjs-auth0/client`
- Route protection via `middleware.ts` at `frontend/middleware.ts` using `withMiddlewareAuthRequired`
- Access session on the client with `useUser()`, on the server with `getSession()`
- Auth0 env vars: `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_ISSUER_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_CLIENT_SECRET`

## File & Component Conventions
- One component per file
- File names: single word preferred; PascalCase for components, lowercase for pages/routes
- Component prop interfaces defined in the same file as the component
- Pages live in `app/` (App Router); reusable components live in `components/`
- Page-specific components co-located with the page, not in `components/`
