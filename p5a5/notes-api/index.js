const express = require('express');
const { z } = require('zod');
const { NotFoundError, ValidationError } = require('./errors');
const { requestLogger } = require('./logger');

const app = express();

app.use(express.json());
app.use(requestLogger);

// In-memory storage 
let notes = [];
let nextId = 1;

// Shared Zod schema 
const noteSchema = z.object({
  text: z.string().min(1, 'text is required'),
  completed: z.boolean().optional().default(false),
});

const noteUpdateSchema = noteSchema.partial();
const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default('1')
    .refine((val) => /^\d+$/.test(val) && Number(val) >= 1, {
      message: 'page must be a positive integer',
    })
    .transform(Number),
  limit: z
    .string()
    .optional()
    .default('10')
    .refine((val) => /^\d+$/.test(val) && Number(val) >= 1, {
      message: 'limit must be a positive integer',
    })
    .transform(Number),
});

function findNoteIndex(id) {
  return notes.findIndex((note) => note.id === id);
}

// ROUTES 
const v1Router = express.Router();

v1Router.get('/notes', (req, res, next) => {
  // ---------- Validate pagination params FIRST ----------
  const paginationResult = paginationSchema.safeParse(req.query);

  if (!paginationResult.success) {
    return next(new ValidationError('Invalid pagination parameters', paginationResult.error.issues));
  }

  const { page, limit } = paginationResult.data;

  // Filtering
  let filtered = notes;

  if (req.query.completed !== undefined) {
    const wantCompleted = req.query.completed === 'true';
    filtered = filtered.filter((note) => note.completed === wantCompleted);
  }

  if (req.query.search) {
    const term = req.query.search.toLowerCase();
    filtered = filtered.filter((note) => note.text.toLowerCase().includes(term));
  }

  // Pagination math 
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startIndex = (page - 1) * limit;
  const pageData = filtered.slice(startIndex, startIndex + limit);

  res.status(200).json({
    data: pageData,
    pagination: { page, limit, total, totalPages },
  });
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

  const note = { id: nextId++, ...result.data, createdAt: new Date().toISOString() };
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

// CENTRALIZED ERROR HANDLER 
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
app.resetForTests = () => {
  notes = [];
  nextId = 1;
};

module.exports = app;
