// My Subscriptions page: which subscriptions are listed as active.
// Run with `node --test --experimental-strip-types src/tests/subscription-access.test.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { subscriptionGrantsAccess } from '../lib/subscription-access.ts';

const NOW = Date.parse('2026-09-30T12:00:00Z');
const sub = (status, endDate) => ({ id: 1, status, startDate: '2025-10-01T00:00:00.000Z', endDate });

test('an ACTIVE subscription whose end date is ahead gives access', () => {
  assert.equal(subscriptionGrantsAccess(sub('ACTIVE', '2027-06-30T00:00:00.000Z'), NOW), true);
  assert.equal(subscriptionGrantsAccess(sub('active', '2026-10-01T00:00:00.000Z'), NOW), true);
});

test('a lapsed ACTIVE subscription (end date passed) does not', () => {
  assert.equal(subscriptionGrantsAccess(sub('ACTIVE', '2026-09-29T00:00:00.000Z'), NOW), false);
});

test('expired, cancelled and pending subscriptions do not, whatever their dates', () => {
  for (const status of ['EXPIRED', 'CANCELLED', 'PENDING']) {
    assert.equal(subscriptionGrantsAccess(sub(status, '2027-06-30T00:00:00.000Z'), NOW), false);
  }
});

test('a missing or unreadable end date does not', () => {
  assert.equal(subscriptionGrantsAccess(sub('ACTIVE', undefined), NOW), false);
  assert.equal(subscriptionGrantsAccess(sub('ACTIVE', 'not a date'), NOW), false);
  assert.equal(subscriptionGrantsAccess(null, NOW), false);
});
