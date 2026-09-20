# Voters Block

Production-oriented sports man-of-the-match voting with a mobile public ballot and secure admin/operator control rooms.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/voters-block run dev` — run the web app through its managed workflow
- `pnpm --filter @workspace/api-server run test` — run high-risk poll rule tests
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — PostgreSQL connection string
- Required secret: `SESSION_SECRET` — password/session pepper; keep stable and private
- Development demo users are seeded automatically: `admin` / `AdminPass24!` and `operator` / `OperatorPass24!`
- Production first run requires `INITIAL_ADMIN_USERNAME` and secret `INITIAL_ADMIN_PASSWORD` (12+ characters). Optional operator bootstrap uses `INITIAL_OPERATOR_USERNAME` and secret `INITIAL_OPERATOR_PASSWORD`.
- After the first production startup creates the accounts, the initial-password environment values can be removed; startup is idempotent.

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — API contract and generated client source
- `lib/db/src/schema/voters-block.ts` — users, sessions, polls, players, and votes
- `artifacts/api-server/src/routes/` — authentication, voting, poll lifecycle, results, and QR routes
- `artifacts/voters-block/src/pages/` — public voter and staff desktop experiences

## Architecture decisions

- Staff authentication uses opaque, hashed, expiring server-side sessions in HttpOnly cookies.
- A PostgreSQL partial unique index enforces one open poll even under concurrent requests.
- Votes upsert on `(poll_id, device_id)`, making a later selection replace the current vote.
- Poll expiry is reconciled on poll reads and vote writes; `closes_at` is fixed to 24 hours after opening.
- Rosters cannot be replaced after the first vote, preserving historical vote integrity.

## Product

- Public QR voters can select or change one current vote per device while a poll is open.
- Admins create polls, validate/upload CSV rosters, open/close polls, monitor results, download QR PNGs, and inspect history.
- Operators monitor the current poll, replace a pre-vote roster, and download its QR code without admin-only creation/history controls.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, always run codegen before editing API consumers.
- Public device IDs discourage accidental duplicate votes but are not identity verification or anti-fraud authentication.
- Changing `SESSION_SECRET` invalidates password verification and existing sessions in this implementation.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
