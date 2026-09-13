# Express vs. NestJS — Comparison

## Which felt faster to get a basic route working?

Express, clearly, and by a wide margin for a project this size. `app.get('/notes', (req, res) => res.json(notes))` is one line, runnable immediately. The NestJS equivalent needed three separate files (`notes.controller.ts`, `notes.service.ts`, `notes.module.ts`) before a single request could be answered, plus registering that module in `AppModule`. For a 5-route in-memory API, that ceremony felt disproportionate to what the app actually does.

## Where NestJS's structure genuinely helped vs. added ceremony

It genuinely helped the moment validation and error handling entered the picture, which is exactly the point Day 4 was making. In Express, I had to *build* the guarantee that every error looks the same — write custom error classes, write one centralized handler, register it last, and remember never to let a route format its own response. In NestJS, throwing `new NotFoundException(...)` produced a consistent `{message, error, statusCode}` shape **automatically**, with zero handler code written by me. That's a real, measurable difference: Express's consistency was something I had to actively construct and could have gotten subtly wrong; NestJS's consistency was a framework default I got by doing nothing extra.

Where it added pure ceremony: the module/controller/service split for something this small. Nothing about a 5-route in-memory notes API benefits from dependency injection — there's exactly one implementation of `NotesService` that will ever exist here, so DI's actual value (swapping implementations, e.g. for testing) never gets exercised. The structure is clearly built for an app that will grow past this size, not this app as it currently stands.

## Where Express's flexibility helped vs. required more decisions

Validation is the clearest example. In Express, I wrote one Zod schema, and TypeScript could infer a type from it directly — one artifact did both jobs, and I chose that shape myself. In NestJS, the DTO class *is* both the type and the validation rules simultaneously via decorators, which is elegant, but I had to separately learn `class-validator`'s decorator API, `@nestjs/mapped-types`' `PartialType` for the update DTO, and remember that none of it does anything until `ValidationPipe` is explicitly registered in `main.ts` — three additional concepts for the same outcome Zod gave me with one schema and a `.partial()` call.

## Which I'd reach for on a real team, and when

For a genuinely small service — a script-like API, a prototype, something with 1-2 developers — I'd reach for Express, specifically because of how fast the validation/error path was to write in Task 1-2. For anything with multiple developers touching the same codebase long-term, or with real service boundaries and things that actually get swapped (a database client behind an interface, a mockable auth service), I'd choose NestJS — the DI container's real value only shows up once "swap this implementation" becomes a genuine, recurring need rather than a hypothetical one.
