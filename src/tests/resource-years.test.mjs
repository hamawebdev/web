// Resources page: who gets the year picker, which years it offers and where it opens.
// Run with `node --test --experimental-strip-types src/tests/resource-years.test.mjs`.
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  FALLBACK_RESOURCE_YEARS,
  defaultResourceYear,
  isResidencyStudent,
  yearsWithYearPack,
} from '../lib/resource-years.ts';

const NOW = Date.parse('2026-09-29T12:00:00Z');
const future = '2027-06-30T00:00:00.000Z';
const past = '2026-09-28T00:00:00.000Z';

// As GET /students/subscriptions returns them
const sub = (type, yearNumber, status = 'ACTIVE', endDate = future) => ({
  id: 1, studyPackId: 7, status, startDate: '2025-10-01T00:00:00.000Z', endDate,
  studyPack: { id: 7, name: type === 'RESIDENCY' ? 'Résidanat' : `${yearNumber} année`, type, yearNumber },
});
const residency = (status, endDate) => sub('RESIDENCY', null, status, endDate);
const year = (yearNumber, status, endDate) => sub('YEAR', yearNumber, status, endDate);

test('an active Résidanat pack makes a residency student', () => {
  assert.equal(isResidencyStudent([residency()], NOW), true);
  assert.equal(isResidencyStudent([year('THREE'), residency()], NOW), true);
  assert.equal(isResidencyStudent([{ ...residency(), status: 'active', studyPack: { type: 'residency' } }], NOW), true);
});

test('a year pack never does, a year-7 pack included', () => {
  assert.equal(isResidencyStudent([year('THREE')], NOW), false);
  assert.equal(isResidencyStudent([year('SEVEN')], NOW), false);
  assert.equal(isResidencyStudent([year('ONE'), year('SEVEN')], NOW), false);
});

test('a Résidanat pack that is lapsed, expired, cancelled or pending does not', () => {
  assert.equal(isResidencyStudent([residency('ACTIVE', past)], NOW), false);
  assert.equal(isResidencyStudent([residency('EXPIRED')], NOW), false);
  assert.equal(isResidencyStudent([residency('CANCELLED')], NOW), false);
  assert.equal(isResidencyStudent([residency('PENDING')], NOW), false);
  assert.equal(isResidencyStudent([residency('ACTIVE', past), year('THREE')], NOW), false);
  assert.equal(isResidencyStudent([{ ...residency(), endDate: undefined }], NOW), false);
});

test('no subscriptions, or a failed load, is not residency', () => {
  assert.equal(isResidencyStudent([], NOW), false);
  assert.equal(isResidencyStudent(null, NOW), false);
  assert.equal(isResidencyStudent(undefined, NOW), false);
});

// As GET /study-packs lists prod's active packs (newest first)
const prodPacks = [
  { id: 7, name: 'Résidanat', type: 'RESIDENCY', yearNumber: null, isActive: true },
  ...['SIX', 'FIVE', 'FOUR', 'THREE', 'TWO', 'ONE'].map((yearNumber, i) => ({ id: 6 - i, name: yearNumber, type: 'YEAR', yearNumber, isActive: true })),
];

test('offers every year with a year pack, in study order, and no year 7 without a year-7 pack', () => {
  assert.deepEqual(yearsWithYearPack(prodPacks), ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX']);
});

test('offers year 7 once a year-7 pack exists', () => {
  const withYear7 = [...prodPacks, { id: 8, type: 'YEAR', yearNumber: 'SEVEN', isActive: true }];
  assert.deepEqual(yearsWithYearPack(withYear7), ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN']);
});

test('leaves out inactive packs and lists each year once', () => {
  const packs = [
    { type: 'YEAR', yearNumber: 'TWO', isActive: true },
    { type: 'YEAR', yearNumber: 'TWO', isActive: true },
    { type: 'YEAR', yearNumber: 'FOUR', isActive: false },
    { type: 'YEAR', yearNumber: null, isActive: true },
  ];
  assert.deepEqual(yearsWithYearPack(packs), ['TWO']);
  assert.deepEqual(yearsWithYearPack(undefined), []);
});

test('opens on 1st year, or on the first year offered', () => {
  assert.equal(defaultResourceYear(yearsWithYearPack(prodPacks)), 'ONE');
  assert.equal(defaultResourceYear(FALLBACK_RESOURCE_YEARS), 'ONE');
  assert.equal(defaultResourceYear(['THREE', 'FIVE']), 'THREE');
  assert.equal(defaultResourceYear([]), null);
});
