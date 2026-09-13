# NestJS Notes API — Validation, Errors, Logging (Task 4)

Functionally equivalent to the Express version, using NestJS's idiomatic patterns: DTOs + `class-validator` for validation, built-in exception classes for errors, and a logging middleware for structured request logs.

## Setup

```
npm install
```

## Run

```
npx tsc && node dist/main.js
```
Server runs on `http://localhost:3000`.

## What's new since Task 3

- **`create-note.dto.ts` / `update-note.dto.ts`** — validation rules matching the Express Zod schema exactly (`text`: required non-empty string; `completed`: optional boolean). `UpdateNoteDto` is derived from `CreateNoteDto` via `PartialType` — the Nest equivalent of TypeScript's `Partial<T>`.
- **`main.ts`** — registers `ValidationPipe` globally with `whitelist: true, forbidNonWhitelisted: true`, so unexpected fields in a request body are rejected with a `400`, not silently dropped or allowed through.
- **`notes.controller.ts`** — now throws NestJS's built-in `NotFoundException` instead of returning `undefined`; every route parameter that should be validated is typed as a DTO class.
- **`logging.middleware.ts`** — one log line per request (method, path, status, duration), applied globally via `AppModule.configure()`.

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

# Error case 3: whitelist rejects unexpected fields (expect 400)
curl -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":"ok","hacker_field":"evil"}'
```

## Real captured results

```
POST /notes {"text":"Buy milk"}          -> 201 {"id":1,"text":"Buy milk","completed":false}
GET  /notes                               -> 200 [{"id":1,"text":"Buy milk","completed":false}]
GET  /notes/1                             -> 200 {"id":1,"text":"Buy milk","completed":false}
PUT  /notes/1 {"completed":true}          -> 200 {"id":1,"text":"Buy milk","completed":true}
DELETE /notes/1                           -> 200 {"id":1,"text":"Buy milk","completed":true}

POST /notes {"text":""}                   -> 400 {"message":["text is required"],"error":"Bad Request","statusCode":400}
GET  /notes/999                           -> 404 {"message":"Note with id 999 not found","error":"Not Found","statusCode":404}
POST /notes {"text":"ok","hacker_field":"evil"} -> 400 {"message":["property hacker_field should not exist"],"error":"Bad Request","statusCode":400}
```

## Sample log output (structured, one line per request)

```
[Nest] LOG [HTTP] POST /notes 201 - 9ms
[Nest] LOG [HTTP] GET /notes 200 - 0ms
[Nest] LOG [HTTP] GET /notes/1 200 - 1ms
[Nest] LOG [HTTP] PUT /notes/1 200 - 1ms
[Nest] LOG [HTTP] DELETE /notes/1 200 - 1ms
[Nest] LOG [HTTP] POST /notes 400 - 3ms
[Nest] LOG [HTTP] GET /notes/999 404 - 0ms
```

## Error shape: consistent, but structurally different from Express

Both frameworks guarantee every error across the whole API looks the same — that's the point of both centralizing. The exact JSON differs:

- **Express:** `{ "error": { "message": "...", "code": "..." } }`
- **NestJS:** `{ "message": "...", "error": "...", "statusCode": ... }`

Same guarantee, different key layout — Nest's shape came for free from its built-in exception classes; Express's shape was hand-built via the custom error classes + centralized handler from Task 2.

## Comparison write-up

See `COMPARISON.md` for the full 300-500 word reflection covering speed to a first route, where Nest's structure helped vs. added ceremony, where Express's flexibility helped vs. required more decisions, and which I'd choose for a real team project.
