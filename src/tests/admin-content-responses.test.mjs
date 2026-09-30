// Admin course resources page: reading GET /courses/:id/resources.
// Run with `node --test --experimental-strip-types src/tests/admin-content-responses.test.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ADMIN_COURSE_RESOURCES_LIMIT, courseResourceItems } from '../lib/admin-content-responses.ts';

const rows = [{ id: 1, title: 'Résumé' }, { id: 2, title: 'Vidéo' }];

test('reads the resources out of the API envelope (the list used to come out empty)', () => {
  const body = { success: true, data: { items: rows, total: 2, page: 1, limit: 1000, totalPages: 1 }, meta: {} };
  assert.deepEqual(courseResourceItems(body), rows);
});

test('accepts a bare page, a bare array and an old nested envelope', () => {
  assert.deepEqual(courseResourceItems({ items: rows, total: 2 }), rows);
  assert.deepEqual(courseResourceItems(rows), rows);
  assert.deepEqual(courseResourceItems({ success: true, data: rows }), rows);
  assert.deepEqual(courseResourceItems({ success: true, data: { success: true, data: { items: rows } } }), rows);
});

test('an empty or unexpected answer is an empty list', () => {
  assert.deepEqual(courseResourceItems({ success: true, data: { items: [], total: 0 } }), []);
  assert.deepEqual(courseResourceItems(null), []);
  assert.deepEqual(courseResourceItems({ success: true, data: { total: 3 } }), []);
});

test('asks for a whole course at once', () => {
  assert.ok(ADMIN_COURSE_RESOURCES_LIMIT >= 83);
});
