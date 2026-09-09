# Notes API — Express Fundamentals + Error Handling + Logging

An in-memory Notes API built with Express, validated at the boundary with Zod, with centralized error handling and structured request logging.

## Setup

```
npm install
```

## Run

```
npm start
```
Server runs on `http://localhost:3000`.

## Architecture

- `errors.js` — `ApiError` base class plus `NotFoundError` (404) and `ValidationError` (400). Routes throw/forward these; they never format a response themselves.
- `logger.js` — structured request logging via `pino`, attached to `res.on('finish')` so it captures the true final status code regardless of which code path produced it.
- `index.js` — routes only call `next(new SomeError(...))` on failure. The **one** centralized error-handling middleware (4-parameter signature, registered last) is the only place that turns an error into an actual HTTP response.

## Routes

| Method | Route | Behavior |
|---|---|---|
| GET | `/notes` | Return all notes |
| GET | `/notes/:id` | Return one note, or throws `NotFoundError` |
| POST | `/notes` | Create a note; throws `ValidationError` on bad input |
| PUT | `/notes/:id` | Update a note; throws `NotFoundError` or `ValidationError` |
| DELETE | `/notes/:id` | Delete a note, or throws `NotFoundError` |

## Error envelope — identical shape across every failure

```json
{ "error": { "message": "...", "code": "...", "details": [ ...optional ] } }
```

Verified identical shape for both required cases:

**Validation failure (400):**
```json
{"error":{"message":"Validation failed","code":"ValidationError","details":[{"origin":"string","code":"too_small","minimum":1,"inclusive":true,"path":["text"],"message":"text is required"}]}}
```

**Not found (404):**
```json
{"error":{"message":"Note with id 999 not found","code":"NotFoundError"}}
```

Both share the exact same top-level `{ error: { message, code } }` structure — only the specific values (and the optional `details` field) differ.

## Sample log output

Captured from a real run exercising all 5 routes plus 2 error cases:

```
[2026-09-09 01:19:08.558 +0000] INFO (482): request completed
    method: "POST"
    path: "/notes"
    statusCode: 201
    durationMs: 21
[2026-09-09 01:19:08.590 +0000] INFO (482): request completed
    method: "GET"
    path: "/notes"
    statusCode: 200
    durationMs: 8
[2026-09-09 01:19:08.610 +0000] INFO (482): request completed
    method: "PUT"
    path: "/notes/1"
    statusCode: 200
    durationMs: 7
[2026-09-09 01:19:08.613 +0000] INFO (482): request completed
    method: "DELETE"
    path: "/notes/1"
    statusCode: 200
    durationMs: 1
[2026-09-09 01:19:08.619 +0000] INFO (482): request completed
    method: "POST"
    path: "/notes"
    statusCode: 400
    durationMs: 1
[2026-09-09 01:19:08.625 +0000] INFO (482): request completed
    method: "GET"
    path: "/notes/999"
    statusCode: 404
    durationMs: 0
```

Every request produces exactly one structured log line, regardless of whether it succeeded or failed — the logging middleware doesn't need to know or care which.

## Manual test commands (curl)

```bash
# Valid flow
curl -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":"Buy milk"}'
curl http://localhost:3000/notes
curl -X PUT http://localhost:3000/notes/1 -H "Content-Type: application/json" -d '{"completed":true}'
curl -X DELETE http://localhost:3000/notes/1

# Error case 1: validation failure (expect 400)
curl -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":""}'

# Error case 2: not found (expect 404)
curl http://localhost:3000/notes/999
```

## What does `next()` do?

`next()` is how Express moves a request forward to the next middleware or route handler in the chain. When called **with an error argument** (`next(err)`), Express skips every remaining normal middleware and jumps straight to the first error-handling middleware it finds — which is exactly how a `NotFoundError` thrown deep inside a route reaches the centralized handler at the bottom of the file. If `next()` is never called and no response is ever sent, the request hangs indefinitely — the client's connection stays open waiting for a response that will never come.

## How Express recognizes an error handler

Express doesn't check the function's name — it checks its **arity** (number of declared parameters). A function with exactly 4 parameters, `(err, req, res, next)`, is registered as error-handling middleware; anything with 3 or fewer is treated as normal middleware. This is also why the error handler must be registered **last** — Express walks middleware in registration order, so anything after it would never run once an error handler sends a response.

## Schema reuse

`noteUpdateSchema` is derived from `noteSchema` via `.partial()` rather than hand-written separately — every field becomes optional for updates, but the underlying validation rules stay identical and automatically stay in sync if `noteSchema` ever changes.

