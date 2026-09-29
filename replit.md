# Voters Block Frontend

Mobile voting and desktop poll-control interface for the existing Voters Block Spring Boot REST API.

## Run

- Managed frontend workflow: `artifacts/voters-block: web`
- Typecheck: `pnpm --filter @workspace/voters-block run typecheck`
- Build: `pnpm --filter @workspace/voters-block run build`

## Backend connection

- Set `VITE_API_BASE_URL` to the existing Spring API base URL, including `/api` when applicable.
- If the frontend and API share an origin and `/api` is already routed to Spring, the variable may be omitted; the default is `/api`.
- The Spring server must allow the frontend origin and the `Authorization` and `Content-Type` request headers when hosted on another origin.
- Admin and staff/operator API calls use HTTP Basic Auth.
- Voter poll discovery and vote submission are anonymous. The Spring API must permit unauthenticated `GET /api/polls`, `GET /api/poll/{publicId}`, and `POST /api/polls/{pollId}/votes`. The UUID lookup must return the requested poll including `publicId` and `active`.

## Contract source

The implemented contract is documented in:

- `attached_assets/Pasted--Voters-Block-API-Spring-Boot-REST-backend-for-sports-m_1789900826189.txt`
- Client adapter: `artifacts/voters-block/src/lib/backend-api.ts`

The original supplied API contract did not describe a token/session endpoint, current-vote lookup, or QR generation. The frontend therefore:

- Provides separate Admin and Staff sign-in flows.
- Validates credentials with the API and stores them in browser `sessionStorage` only.
- Maps Staff access to the API's operator permissions.
- Adds the stored Basic Auth header to protected API requests.
- Creates polls with name, location, two optional image references, and candidates entered manually or imported from CSV.
- Persists an anonymous voter device ID and the most recent local selection.
- Generates voter QR PNGs in the browser using each poll's `publicId`; a QR opens `/<publicId>` and only displays a matching active poll.
- Uses `GET /api/polls/history` for previous polls, and `GET /api/polls` for the main active poll page.
- Does not claim that local role selection is secure authentication.

## Product routes

- `/` — public active poll and voting
- `/:publicId` — public voting for the matching active UUID poll only
- `/login` — separate Admin and Staff Basic Auth sign-in
- `/dashboard` — all open polls with live results; admins can close each poll and download its voter QR
- `/polls/new` — admin poll creation and CSV-to-candidate bulk upload
- `/polls/:id` — poll detail, results, QR download for active polls, and admin close action
- `/polls/history` — staff/admin previous polls

## CSV upload

Required headers: `name`, `jerseyNumber`, `teamName`. Optional header: `metadata`.
The frontend validates jersey numbers as non-negative integers and sends these as separate candidate fields.