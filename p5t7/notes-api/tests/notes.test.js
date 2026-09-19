const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../index');

function reset() {
  app.resetForTests();
}

async function seedNotes(count, { completed = false, textPrefix = 'Note' } = {}) {
  for (let i = 1; i <= count; i++) {
    await request(app).post('/v1/notes').send({ text: `${textPrefix} ${i}`, completed });
  }
}

// Pagination boundaries 

test('pagination: first page returns correct slice and metadata', async () => {
  reset();
  await seedNotes(25);

  const res = await request(app).get('/v1/notes?page=1&limit=10');

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 10);
  assert.deepStrictEqual(res.body.pagination, { page: 1, limit: 10, total: 25, totalPages: 3 });
});

test('pagination: last page returns the remainder', async () => {
  reset();
  await seedNotes(25);

  const res = await request(app).get('/v1/notes?page=3&limit=10');

  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.data.length, 5); // 25 - 20 = 5 remaining
});

test('pagination: a page beyond available data returns empty array, not an error', async () => {
  reset();
  await seedNotes(25);

  const res = await request(app).get('/v1/notes?page=99&limit=10');

  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body.data, []);
  assert.strictEqual(res.body.pagination.total, 25);
});

test('pagination: defaults to page=1, limit=20 when not provided', async () => {
  reset();
  await seedNotes(25);

  const res = await request(app).get('/v1/notes');

  assert.strictEqual(res.body.pagination.page, 1);
  assert.strictEqual(res.body.pagination.limit, 20);
  assert.strictEqual(res.body.data.length, 20);
});

// Filtering + pagination together

test('filtering + pagination: total/totalPages reflect the FILTERED set', async () => {
  reset();
  await seedNotes(10, { completed: false, textPrefix: 'Pending' });
  await seedNotes(5, { completed: true, textPrefix: 'Done' });

  const res = await request(app).get('/v1/notes?completed=true&limit=2&page=2');

  assert.strictEqual(res.body.pagination.total, 5);
  assert.strictEqual(res.body.pagination.totalPages, 3); 
  assert.strictEqual(res.body.data.length, 2);
  assert.ok(res.body.data.every((n) => n.completed === true));
});

test('filtering: text search matches only notes containing the term', async () => {
  reset();
  await seedNotes(3, { textPrefix: 'Buy milk' });
  await seedNotes(2, { textPrefix: 'Walk dog' });

  const res = await request(app).get('/v1/notes?search=milk');

  assert.strictEqual(res.body.pagination.total, 3);
});

// All 4 error cases from Step 4 

test('error 1/4: validation failure on POST returns 400', async () => {
  reset();
  const res = await request(app).post('/v1/notes').send({ text: '' });

  assert.strictEqual(res.status, 400);
  assert.strictEqual(res.body.error.code, 'ValidationError');
});

test('error 2/4: not-found on GET/PUT/DELETE returns 404, same envelope shape', async () => {
  reset();

  const getRes = await request(app).get('/v1/notes/999');
  const putRes = await request(app).put('/v1/notes/999').send({ text: 'x' });
  const deleteRes = await request(app).delete('/v1/notes/999');

  for (const res of [getRes, putRes, deleteRes]) {
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error.code, 'NotFoundError');
    assert.ok('message' in res.body.error);
  }
});

test('error 3/4: invalid pagination params return 400, not a crash or silent default', async () => {
  reset();

  const negativeRes = await request(app).get('/v1/notes?page=-1');
  const nonNumericRes = await request(app).get('/v1/notes?limit=abc');

  assert.strictEqual(negativeRes.status, 400);
  assert.strictEqual(negativeRes.body.error.code, 'ValidationError');
  assert.strictEqual(nonNumericRes.status, 400);
  assert.strictEqual(nonNumericRes.body.error.code, 'ValidationError');
});

test('error 4/4: simulated 500 does NOT leak a raw stack trace, uses the same envelope shape', async () => {
  reset();

  const res = await request(app).get('/v1/notes-simulate-error/boom');

  assert.strictEqual(res.status, 500);
  // SAME top-level shape as every other error: { error: { message, code } }
  assert.ok('message' in res.body.error);
  assert.ok('code' in res.body.error);
  assert.strictEqual(res.body.error.code, 'InternalError');
  const responseText = JSON.stringify(res.body);
  assert.ok(!responseText.includes('Simulated unexpected server error'));
  assert.ok(!responseText.includes('at ')); // no stack trace frames leaked
});

// Full CRUD sanity check

test('full flow: create, read, update, delete all work and stay consistent', async () => {
  reset();

  const created = await request(app).post('/v1/notes').send({ text: 'Buy milk' });
  assert.strictEqual(created.status, 201);
  const id = created.body.data.id;

  const fetched = await request(app).get(`/v1/notes/${id}`);
  assert.strictEqual(fetched.status, 200);

  const updated = await request(app).put(`/v1/notes/${id}`).send({ completed: true });
  assert.strictEqual(updated.status, 200);
  assert.strictEqual(updated.body.data.completed, true);

  const deleted = await request(app).delete(`/v1/notes/${id}`);
  assert.strictEqual(deleted.status, 200);

  const afterDelete = await request(app).get(`/v1/notes/${id}`);
  assert.strictEqual(afterDelete.status, 404);
});
