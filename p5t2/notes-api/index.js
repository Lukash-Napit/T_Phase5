// ============================================================
// index.js
// Notes API -- 5 routes, centralized error handling, and
// structured request logging.
// ============================================================

const express = require('express');
const { z } = require('zod');
const { NotFoundError, ValidationError } = require('./errors');
const { requestLogger } = require('./logger');

const app = express();

app.use(express.json());
app.use(requestLogger); // logs every request on completion, regardless of outcome

// ---------- In-memory storage ----------

let notes = [];
let nextId = 1;

// ---------- Shared Zod schema (unchanged from Task 1) ----------

const noteSchema = z.object({
  text: z.string().min(1, 'text is required'),
  completed: z.boolean().optional().default(false),
});

const noteUpdateSchema = noteSchema.partial();

function findNoteIndex(id) {
  return notes.findIndex((note) => note.id === id);
}

// ============================================================
// ROUTES -- every route now just THROWS/FORWARDS, never formats
// its own error response.
// ============================================================

app.get('/notes', (req, res) => {
  res.status(200).json({ data: notes });
});

app.get('/notes/:id', (req, res, next) => {
  const id = Number(req.params.id);
  const index = findNoteIndex(id);

  if (index === -1) {
    // Forward, don't format -- the centralized handler decides
    // the actual response shape.
    return next(new NotFoundError(`Note with id ${id} not found`));
  }

  res.status(200).json({ data: notes[index] });
});

app.post('/notes', (req, res, next) => {
  const result = noteSchema.safeParse(req.body);

  if (!result.success) {
    return next(new ValidationError('Validation failed', result.error.issues));
  }

  const note = { id: nextId++, ...result.data };
  notes.push(note);
  res.status(201).json({ data: note });
});

app.put('/notes/:id', (req, res, next) => {
  const id = Number(req.params.id);
  const index = findNoteIndex(id);

  if (index === -1) {
    return next(new NotFoundError(`Note with id ${id} not found`));
  }

  const result = noteUpdateSchema.safeParse(req.body);

  if (!result.success) {
    return next(new ValidationError('Validation failed', result.error.issues));
  }

  notes[index] = { ...notes[index], ...result.data };
  res.status(200).json({ data: notes[index] });
});

app.delete('/notes/:id', (req, res, next) => {
  const id = Number(req.params.id);
  const index = findNoteIndex(id);

  if (index === -1) {
    return next(new NotFoundError(`Note with id ${id} not found`));
  }

  const [removed] = notes.splice(index, 1);
  res.status(200).json({ data: removed });
});

// ============================================================
// CENTRALIZED ERROR HANDLER -- registered LAST, after every
// route. The 4-PARAMETER signature (err, req, res, next) is what
// tells Express this is specifically an error handler, not a
// normal middleware function.
// ============================================================

app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.name || 'InternalError',
      // Only included when present (e.g. Zod's validation issues) --
      // a generic 500 won't have this field at all.
      ...(err.details ? { details: err.details } : {}),
    },
  });
});

const PORT = 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Notes API running on port ${PORT}`));
}

module.exports = app;
