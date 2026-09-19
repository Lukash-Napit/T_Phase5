# Notes API — Task 7: Full-Featured Notes API

A production-shaped Notes API: pagination, filtering, and consistent error handling across every endpoint, verified with an automated test suite.

## Setup

```
npm install
```

## Run

```
npm start
```
Server runs on `http://localhost:3000`.

## Run the tests

```
npm test
```
Runs 11 automated tests covering pagination boundaries, filtering+pagination interaction, and all 4 error cases from Step 4. Uses `cross-env` so it works identically on Windows, Mac, and Linux.

## Pagination

`GET /v1/notes?page=1&limit=20` — both optional, defaulting to `page=1, limit=20`.
```json
{ "data": [...], "pagination": { "page": 1, "limit": 20, "total": 87, "totalPages": 5 } }
```
- A page beyond available data returns `200` with an empty `data` array — never an error.
- Malformed values (`page=-1`, `limit=abc`) are rejected with `400` and a specific field-level message.

## Filtering (combinable with pagination)

- **Boolean flag**: `GET /v1/notes?completed=true`
- **Text search**: `GET /v1/notes?search=groceries` (case-insensitive substring match)
- Both combine with pagination: `?completed=true&page=2&limit=10`

**Verified by test**: `total`/`totalPages` are always calculated from the **filtered** result set — with 15 notes total and only 5 completed, `?completed=true` reports `total: 5`, never `total: 15`.

## Every endpoint audited for consistent error shape

All 4 required error cases return `{ error: { message, code, details? } }`:

| Case | Status | How it was verified |
|---|---|---|
| Validation failure (empty `text`) | 400 | Automated test + manual curl |
| Not-found (GET/PUT/DELETE unknown id) | 404 | Automated test + manual curl |
| Invalid pagination (`page=-1`, `limit=abc`) | 400 | Automated test + manual curl |
| Unexpected server error | 500 | Automated test + manual curl (see below) |

### The 500 case, specifically

`GET /v1/notes-simulate-error/boom` deliberately throws an untyped error (no `statusCode`) purely to exercise and document the 500 path — it is not a real feature. Confirmed the client-facing response leaks **nothing** internal:

**Client sees:**
```json
{"error":{"message":"Internal server error","code":"InternalError"}}
```
**Server's own log (never sent to the client):**
```
Unexpected error: Error: Simulated unexpected server error
    at /home/claude/notes-api/index.js:157:11
    at Layer.handleRequest (...)
```
The centralized handler explicitly replaces the real message/stack with a generic one whenever `statusCode === 500`, while still logging the full detail server-side for debugging — the automated test (`error 4/4`) asserts the raw error text never appears anywhere in the client response body.

## Postman collection

See `notes-api.postman_collection.json` — every endpoint has a realistic example (not placeholder data), a description, and documented error responses (400 validation, 400 invalid pagination, 404 not-found, 500 simulated).

## Manual verification commands

```bash
# Pagination math, by hand, against a known dataset (per the assignment's own suggested check):
# seed 25 notes, limit=10 -> expect 3 pages, last page has 5 notes
for i in $(seq 1 25); do curl -s -o /dev/null -X POST http://localhost:3000/v1/notes -H "Content-Type: application/json" -d "{\"text\":\"Note $i\"}"; done
curl -s "http://localhost:3000/v1/notes?page=3&limit=10" | python3 -m json.tool

# Filter + paginate together
curl -s "http://localhost:3000/v1/notes?completed=true&page=1&limit=5"

# All 4 error cases
curl -s -w "\n%{http_code}\n" -X POST http://localhost:3000/v1/notes -d '{"text":""}' -H "Content-Type: application/json"
curl -s -w "\n%{http_code}\n" http://localhost:3000/v1/notes/999
curl -s -w "\n%{http_code}\n" "http://localhost:3000/v1/notes?page=-1"
curl -s -w "\n%{http_code}\n" http://localhost:3000/v1/notes-simulate-error/boom
```
