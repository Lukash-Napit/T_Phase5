const express = require('express');
const { z } = require('zod');
const { NotFoundError, ValidationError } = require('./errors');
const { requestLogger } = require('./logger');
const rateLimiter = require('./rateLimiter');

const app = express();

app.use(express.json());
app.use(requestLogger);

app.use(rateLimiter(5, 2000));

let notes = [];
let nextId = 1;

const noteSchema = z.object({
  text: z.string().min(1, 'text is required'),
  completed: z.boolean().optional().default(false),
});

const noteUpdateSchema = noteSchema.partial();

function findNoteIndex(id) {
  return notes.findIndex((note) => note.id === id);
}

const v1Router = express.Router();

v1Router.get('/notes', (req, res) => {
  res.status(200).json({ data: notes });
});

v1Router.get('/notes/:id', (req, res, next) => {
  const id = Number(req.params.id);
  const index = findNoteIndex(id);

  if (index === -1) {
    return next(new NotFoundError(`Note with id ${id} not found`));
  }

  res.status(200).json({ data: notes[index] });
});

v1Router.post('/notes', (req, res, next) => {
  const result = noteSchema.safeParse(req.body);

  if (!result.success) {
    return next(new ValidationError('Validation failed', result.error.issues));
  }

  const note = { id: nextId++, ...result.data };
  notes.push(note);
  res.status(201).json({ data: note });
});

v1Router.put('/notes/:id', (req, res, next) => {
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

v1Router.delete('/notes/:id', (req, res, next) => {
  const id = Number(req.params.id);
  const index = findNoteIndex(id);

  if (index === -1) {
    return next(new NotFoundError(`Note with id ${id} not found`));
  }

  const [removed] = notes.splice(index, 1);
  res.status(200).json({ data: removed });
});

app.use('/v1', v1Router);
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    error: {
      message: err.message || 'Internal server error',
      code: err.name || 'InternalError',
      ...(err.details ? { details: err.details } : {}),
    },
  });
});

const PORT = 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Notes API running on port ${PORT}`));
}

module.exports = app;
