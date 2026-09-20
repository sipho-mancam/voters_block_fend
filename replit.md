# Voters Block Frontend

Mobile voting and desktop poll-control interface for the existing Voters Block Spring Boot REST API.

## Run

- Managed frontend workflow: `artifacts/voters-block: web`
- Typecheck: `pnpm --filter @workspace/voters-block run typecheck`
- Build: `pnpm --filter @workspace/voters-block run build`

## Backend connection

- Set `VITE_API_BASE_URL` to the existing Spring API base URL, including `/api` when applicable.
- If the frontend and API share an origin and `/api` is already routed to Spring, the variable may be omitted; the default is `/api`.
- The Spring server must allow the frontend origin and the `X-User-Role` request header when hosted on another origin.
- The frontend sends only the documented roles: `ADMIN`, `VOTER`, and `VIEWER`.

## Contract source

The implemented contract is documented in:

- `attached_assets/Pasted--Voters-Block-API-Spring-Boot-REST-backend-for-sports-m_1789900826189.txt`
- Client adapter: `artifacts/voters-block/src/lib/backend-api.ts`

The supplied API does not provide real login/session endpoints, poll titles/fixtures, closed-poll history, current-vote lookup, or QR generation. The frontend therefore:

- Uses local workstation role selection for ADMIN and VIEWER mode.
- Persists an anonymous voter device ID and the most recent local selection.
- Generates voter QR PNGs in the browser.
- Shows active polls only, matching `GET /api/polls`.
- Does not claim that local role selection is secure authentication.

## Product routes

- `/` — public active poll and voting
- `/login` — documented API role selection
- `/dashboard` — active poll and live results
- `/polls/new` — admin poll creation and CSV-to-candidate bulk upload
- `/polls/:id` — active poll detail, results, QR download, and admin close action

## CSV upload

Required headers: `name`, `squadNumber`. Optional headers: `position`, `team`.
The frontend combines the optional values into the backend candidate `metadata` field.