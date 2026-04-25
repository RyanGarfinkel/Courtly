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

## File & Component Conventions
- One component per file
- File names: single word preferred; PascalCase for components, lowercase for pages/routes
- Component prop interfaces defined in the same file as the component
- Pages live in `app/` (App Router); reusable components live in `components/`
- Page-specific components co-located with the page, not in `components/`
