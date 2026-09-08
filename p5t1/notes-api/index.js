const express = require('express');
const { z } = require('zod');

const app = express();

app.use(express.json());

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

// ROUTES
// GET /notes -- return all notes
app.get('/notes', (req, res) => {
  res.status(200).json({ data: notes });
});

// GET /notes/:id -- return one note, or 404
app.get('/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = findNoteIndex(id);

  if (index === -1) {
    return res.status(404).json({ error: { message: `Note with id ${id} not found` } });
  }

  res.status(200).json({ data: notes[index] });
});

// POST /notes - create, validated
app.post('/notes', (req, res) => {
  const result = noteSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: { message: 'Validation failed', details: result.error.issues },
    });
  }

  const note = { id: nextId++, ...result.data };
  notes.push(note);
  res.status(201).json({ data: note });
});

// PUT /notes/:id - update, validated, 404 if missing
app.put('/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = findNoteIndex(id);

  if (index === -1) {
    return res.status(404).json({ error: { message: `Note with id ${id} not found` } });
  }

  const result = noteUpdateSchema.safeParse(req.body);

  if (!result.success) {
    return res.status(400).json({
      error: { message: 'Validation failed', details: result.error.issues },
    });
  }

  notes[index] = { ...notes[index], ...result.data };
  res.status(200).json({ data: notes[index] });
});

// DELETE /notes/:id - delete, 404 if missing
app.delete('/notes/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = findNoteIndex(id);

  if (index === -1) {
    return res.status(404).json({ error: { message: `Note with id ${id} not found` } });
  }

  const [removed] = notes.splice(index, 1);
  res.status(200).json({ data: removed });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Notes API running on port ${PORT}`));

module.exports = app;
