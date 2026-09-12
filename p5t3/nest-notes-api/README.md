# NestJS Notes API — Architecture Skeleton

Same 5 routes as the Task 1/2 Express version, rebuilt in NestJS's controller/service/module structure. Skeleton only — no validation or error handling yet (that's Task 4).

## Setup

```
npm install
```

## Run

```
npx tsc && node dist/main.js
```
Server runs on `http://localhost:3000`.

(Note: `ts-node`'s CLI had a version-compatibility issue in the environment this was built in — compiling with `tsc` first and running the plain `.js` output is the reliable path. If `npx ts-node src/main.ts` works fine in your own setup, that's an equally valid way to run it directly.)

## Project structure

```
src/
  main.ts             # entry point, bootstraps the Nest app
  app.module.ts        # root module, imports NotesModule
  notes.module.ts       # declares NotesController + NotesService together
  notes.controller.ts   # HTTP concerns only -- routes, params, body
  notes.service.ts      # all actual data logic -- the in-memory notes array
```

## Routes

| Method | Route | Behavior |
|---|---|---|
| GET | `/notes` | Return all notes |
| GET | `/notes/:id` | Return one note by id |
| POST | `/notes` | Create a note (Nest returns `201` automatically) |
| PUT | `/notes/:id` | Update an existing note |
| DELETE | `/notes/:id` | Delete a note |

## Manual test commands (curl)

```bash
curl -X POST http://localhost:3000/notes -H "Content-Type: application/json" -d '{"text":"Buy milk using nest"}'
curl http://localhost:3000/notes
curl http://localhost:3000/notes/1
curl -X PUT http://localhost:3000/notes/1 -H "Content-Type: application/json" -d '{"completed":true}'
curl -X DELETE http://localhost:3000/notes/1
```

All 5 routes were tested against this exact code and confirmed to behave equivalently to the Express version — same status codes, same data shapes.

## How dependency injection wires `NotesService` into `NotesController`

`NotesController`'s constructor declares `private readonly notesService: NotesService`. Because NestJS's TypeScript setup enables `emitDecoratorMetadata`, the compiler embeds the constructor parameter's **type metadata** into the compiled JavaScript, even though JavaScript itself has no native concept of types. At startup, Nest reads that metadata, sees the controller needs something of type `NotesService`, confirms it's registered as a provider in `NotesModule`, and **constructs the instance itself** via its own DI container — handing it to the controller automatically. Nowhere in this codebase is `new NotesService()` ever written.

## Real evidence: what happens if you forget to register the provider

To make this concrete, I temporarily removed `NotesService` from `NotesModule`'s `providers` array and ran the app. Nest failed to start with this exact error:

```
UnknownDependenciesException [Error]: Nest can't resolve dependencies of the
NotesController (?). Please make sure that the argument NotesService at
index [0] is available in the NotesModule module.

Potential solutions:
- Is NotesModule a valid NestJS module?
- If NotesService is a provider, is it part of the current NotesModule?
- If NotesService is exported from a separate @Module, is that module
  imported within NotesModule?
```

This confirms the common pitfall the assignment warns about is a real, specific, actionable error — not a silent failure — and that registering a provider in the module's `providers` array is what makes it discoverable by the DI container in the first place.
