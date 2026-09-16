const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../index');

function reset() {
  app.resetForTests();
}

async function seedNotes(count, { completed = false, textPrefix = 'Note' } = {}) {
  for (let i = 1; i <= count; i++) {
    await request(app)
      .post('/v1/notes')
      .send({ text: `${textPrefix} ${i}`, completed });
  }
}

// Pagination boundaries 

test('pagination: first page returns the correct slice and metadata', async () => {
  reset();
  await seedNotes(15);

  const res = await request(app).get('/v1/notes?page=1&limit=10');

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 10);
  assert.deepStrictEqual(res.body.pagination, { page: 1, limit: 10, total: 15, totalPages: 2 });
});

test('pagination: last page returns the remainder, not a full page', async () => {
  reset();
  await seedNotes(15);

  const res = await request(app).get('/v1/notes?page=2&limit=10');

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 5); // remainder, not 10
  assert.strictEqual(res.body.pagination.totalPages, 2);
});

test('pagination: a page beyond available data returns an empty array, not an error', async () => {
  reset();
  await seedNotes(15);

  const res = await request(app).get('/v1/notes?page=99&limit=10');

  assert.strictEqual(res.status, 200); // NOT an error status
  assert.deepStrictEqual(res.body.data, []);
  assert.strictEqual(res.body.pagination.total, 15); // metadata still accurate
});

// Filtering combined with pagination 

test('filtering + pagination: total/totalPages reflect the FILTERED set, not the full dataset', async () => {
  reset();
  await seedNotes(10, { completed: false, textPrefix: 'Pending' });
  await seedNotes(5, { completed: true, textPrefix: 'Done' });
  // 15 notes total, but only 5 are completed=true

  const res = await request(app).get('/v1/notes?completed=true&limit=2&page=2');

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.pagination.total, 5);
  assert.strictEqual(res.body.pagination.totalPages, 3); // ceil(5/2)
  assert.strictEqual(res.body.data.length, 2);
  assert.ok(res.body.data.every((note) => note.completed === true));
});

test('filtering: text search matches only notes containing the search term', async () => {
  reset();
  await seedNotes(3, { textPrefix: 'Buy milk' });
  await seedNotes(2, { textPrefix: 'Walk dog' });

  const res = await request(app).get('/v1/notes?search=milk');

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.pagination.total, 3);
  assert.ok(res.body.data.every((note) => note.text.toLowerCase().includes('milk')));
});

// Error cases 

test('error case: validation failure on POST returns 400 with structured details', async () => {
  reset();

  const res = await request(app).post('/v1/notes').send({ text: '' });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'ValidationError');
  assert.ok(Array.isArray(res.body.error.details));
});

test('error case: not-found on GET by id returns 404 with the same envelope shape', async () => {
  reset();

  const res = await request(app).get('/v1/notes/999');

  assert.strictEqual(res.status, 404);
  assert.strictEqual(res.body.error.code, 'NotFoundError');
  // SAME top-level shape as the validation error above: { error: { message, code } }
  assert.ok('message' in res.body.error);
  assert.ok('code' in res.body.error);
});

test('error case: invalid pagination params return 400, not a crash or silent default', async () => {
  reset();

  const res = await request(app).get('/v1/notes?page=-1');

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'ValidationError');
});

// Full CRUD sanity check 

test('full flow: create, read, update, delete all work and stay consistent', async () => {
  reset();

  const created = await request(app).post('/v1/notes').send({ text: 'Buy milk' });
  assert.strictEqual(created.status, 201);
  const id = created.body.data.id;

  const fetched = await request(app).get(`/v1/notes/${id}`);
  assert.strictEqual(fetched.status, 200);
  assert.strictEqual(fetched.body.data.text, 'Buy milk');

  const updated = await request(app).put(`/v1/notes/${id}`).send({ completed: true });
  assert.strictEqual(updated.status, 200);
  assert.strictEqual(updated.body.data.completed, true);

  const deleted = await request(app).delete(`/v1/notes/${id}`);
  assert.strictEqual(deleted.status, 200);

  const afterDelete = await request(app).get(`/v1/notes/${id}`);
  assert.strictEqual(afterDelete.status, 404);
});
