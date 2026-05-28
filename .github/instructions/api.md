---
applyTo: "**/app/api/**"
---

# API Route Instructions

## Location

All API routes live under `/frontend/app/api/` as Next.js Route Handlers. Each route is a `route.ts` file inside a directory matching the URL path.

## Pattern

Every route handler follows this shape:

1. Read the request (params, body, searchParams)
2. Validate inputs — return early with a `{ error: string }` response and appropriate HTTP status if invalid
3. Call a service or orchestrator function — no business logic inline in the handler
4. Return a JSON response

```ts
export const POST = async (request: NextRequest) =>
{
	const body = await request.json();
	if(!body.required_field)
		return NextResponse.json({ error: 'required_field is required' }, { status: 400 });

	const result = await someService(body.required_field);
	return NextResponse.json(result);
};
```

## No Business Logic in Routes

Route handlers are thin. They do not:
- Contain AI logic (that belongs in `/lib/agents/`)
- Contain database queries (that belongs in `/lib/services/`)
- Contain orchestration logic (that belongs in `/lib/orchestrators/`)

## Authentication

For protected routes, check the session at the top of the handler:

```ts
const session = await auth0.getSession();
if(!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
const userId = session.user.sub;
```

Import `auth0` from `@/lib/auth0`.

## Error Responses

Always return `{ error: string }` with an appropriate HTTP status:

| Situation | Status |
|---|---|
| Missing/invalid input | 400 |
| Not authenticated | 401 |
| Forbidden (wrong user) | 403 |
| Resource not found | 404 |
| Conflict (duplicate, concluded, etc.) | 409 |
| Internal failure | 500 |

Never swallow errors silently — always return a response.

## Slow AI Routes

Routes that call AI agents or orchestrators may take longer than the default serverless timeout. Set `maxDuration` at the top of the file:

```ts
export const maxDuration = 60; // seconds — use 60-120 for AI routes
```

This is required on Vercel for routes that call Gemini.

## Key Routes

| Route | Method | Purpose |
|---|---|---|
| `/api/hearing/start` | POST | Start a new hearing — initializes hearing state and first judge question |
| `/api/hearing/turn` | POST | Submit a user response and advance the hearing turn |
| `/api/hearing/[id]` | GET | Fetch current hearing state |
| `/api/hearing/assist` | POST | Law clerk: summarize or answer a question about the hearing |
| `/api/hearing/hint` | POST | Generate response hints for the current question |
| `/api/hearing/stress-test` | POST | Analyze a draft response before submission |
| `/api/cases` | GET, POST | Search cases or create a custom case |
| `/api/cases/popular` | GET | Return a random sample of seeded cases |
| `/api/cases/mine` | GET | Return the authenticated user's custom and saved cases |
| `/api/cases/[id]` | GET | Fetch a single case by ID |
| `/api/cases/[id]/save` | POST | Toggle save/unsave a case for the authenticated user |
| `/api/brief/draft` | POST | Generate a brief draft from case context |
| `/api/brief/expand` | POST | Expand notes into formal paragraphs |
| `/api/brief/strengthen` | POST | Sharpen existing brief text |
| `/api/brief/counter` | POST | Anticipate counterarguments |
| `/api/brief/save-draft` | POST | Persist a draft to MongoDB |
| `/api/brief/load-draft` | GET | Load the latest saved draft for a case |
| `/api/multiplayer` | POST | Create a new head-to-head match |
| `/api/multiplayer/mine` | GET | Return the authenticated user's matches |
| `/api/multiplayer/[match_id]` | GET, DELETE | Fetch or cancel a match |
| `/api/multiplayer/[match_id]/join` | POST | Join an existing match as the opposing side |
| `/api/research` | GET | Return cached or freshly fetched research sources for a case |
| `/api/external-cases` | GET | Search CourtListener for cases matching a query |
| `/api/health` | GET | Health check — returns `{ status: 'ok' }` |

## Function Naming

Export named functions matching the HTTP method in uppercase:

```ts
export const GET = async (request: NextRequest) => { ... };
export const POST = async (request: NextRequest) => { ... };
export const DELETE = async (request: NextRequest, { params }) => { ... };
```

Never use `export default` for route handlers.
