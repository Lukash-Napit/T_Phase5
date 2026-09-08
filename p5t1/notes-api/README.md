# Notes API — Express Fundamentals + Validation Kata

An in-memory Notes API built with Express and validated at the boundary with Zod.

## Setup

```
npm install
```

## Run

```
npm start
```
Server runs on `http://localhost:3000`.

## Routes

| Method | Route | Behavior |
|---|---|---|
| GET | `/notes` | Return all notes |
| GET | `/notes/:id` | Return one note, or 404 |
| POST | `/notes` | Create a note (validated) |
| PUT | `/notes/:id` | Update a note (validated), 404 if missing |
| DELETE | `/notes/:id` | Delete a note, 404 if missing |

## Manual test commands (curl)

```bash
# Create
curl -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":"Buy milk"}'

# List all
curl http://localhost:3000/notes

# Get one
curl http://localhost:3000/notes/1

# Update (partial — only completed)
curl -X PUT http://localhost:3000/notes/1 -H "Content-Type: application/json" -d '{"completed":true}'

# Delete
curl -X DELETE http://localhost:3000/notes/1

# Validation failure — empty text (expect 400, not 500 or silent success)
curl -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":""}'

# Not found (expect 404)
curl http://localhost:3000/notes/999
```

## What does `next()` do?

`next()` is how Express moves a request forward to the next middleware or route handler in the chain — it's an explicit signal that says "I'm done with my part, someone else should handle what's next." If a middleware function never calls `next()` **and** never sends a response (`res.json()`, `res.send()`, etc.), the request hangs indefinitely — the client's connection stays open waiting for a response that will never come, since nothing ever told Express the request was finished. This route/middleware chain never got the memo to keep going, and Express has no built-in timeout to rescue it.

## Schema reuse

`noteUpdateSchema` is derived from `noteSchema` via `.partial()` rather than being hand-written separately — every field becomes optional for updates, but the underlying validation rules (e.g. `text` must be a non-empty string when present) stay identical and automatically stay in sync if `noteSchema` ever changes.
