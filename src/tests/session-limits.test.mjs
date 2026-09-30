// Practice session wizard: how many questions the student can pick.
// Run with `node --test --experimental-strip-types src/tests/session-limits.test.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { MAX_SESSION_QUESTIONS, selectableQuestionCount } from '../lib/session-limits.ts';

test('the API limit is 1,000 questions per session', () => {
  assert.equal(MAX_SESSION_QUESTIONS, 1000);
});

test('a selection larger than the limit offers the limit (the API refused more with a 400)', () => {
  assert.equal(selectableQuestionCount(39534), 1000);
  assert.equal(selectableQuestionCount(1001), 1000);
});

test('a smaller selection offers everything it holds', () => {
  assert.equal(selectableQuestionCount(1000), 1000);
  assert.equal(selectableQuestionCount(83), 83);
  assert.equal(selectableQuestionCount(0), 0);
  assert.equal(selectableQuestionCount(Number.NaN), 0);
});
