import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAuthorized, parseDecision, REVIEW_NOTE, tokensMatch } from '../src/review.ts';

const SECRET = 'k7Qd2NfP9wX4zR1sT6vB8yH3jL5mC0aE'; // 32 chars, test-only

test('review routes reject a missing token', () => {
  assert.equal(isAuthorized(null, SECRET), false);
  assert.equal(isAuthorized('', SECRET), false);
  assert.equal(isAuthorized('Bearer', SECRET), false);
  assert.equal(isAuthorized('Bearer ', SECRET), false);
});

test('review routes reject a wrong token', () => {
  assert.equal(isAuthorized(`Bearer ${SECRET}x`, SECRET), false, 'longer');
  assert.equal(isAuthorized(`Bearer ${SECRET.slice(0, -1)}`, SECRET), false, 'truncated');
  assert.equal(isAuthorized(`Bearer ${'a'.repeat(SECRET.length)}`, SECRET), false, 'same length, wrong bytes');
  assert.equal(isAuthorized('Bearer undefined', SECRET), false);
  assert.equal(isAuthorized(SECRET, SECRET), false, 'raw token without the Bearer scheme');
});

test('review routes reject every request when the secret is unset', () => {
  assert.equal(isAuthorized(`Bearer ${SECRET}`, undefined), false);
  assert.equal(isAuthorized('Bearer ', undefined), false);
  assert.equal(isAuthorized('Bearer anything', ''), false);
});

test('a short or weak secret is refused outright', () => {
  assert.equal(tokensMatch('short', 'short'), false, 'a short secret must never authorize');
  assert.equal(tokensMatch(SECRET, SECRET), true);
});

test('the correct token authorizes, case-insensitively on the scheme', () => {
  assert.equal(isAuthorized(`Bearer ${SECRET}`, SECRET), true);
  assert.equal(isAuthorized(`bearer ${SECRET}`, SECRET), true);
});

test('decisions are validated before they touch the queue', () => {
  assert.deepEqual(parseDecision({ id: 4, action: 'approve' }), { id: 4, action: 'approve' });
  assert.deepEqual(parseDecision({ id: '7', action: 'reject' }), { id: 7, action: 'reject' });
  assert.equal(parseDecision({ id: 4, action: 'delete' }), null);
  assert.equal(parseDecision({ id: 0, action: 'approve' }), null);
  assert.equal(parseDecision({ id: -1, action: 'approve' }), null);
  assert.equal(parseDecision({ id: 'abc', action: 'approve' }), null);
  assert.equal(parseDecision({ action: 'approve' }), null);
  assert.equal(parseDecision(null), null);
});

test('the queue tells reviewers that approval does not change the map', () => {
  assert.ok(/human/i.test(REVIEW_NOTE));
  assert.ok(/assets\.ts/.test(REVIEW_NOTE));
  assert.ok(/never writes/i.test(REVIEW_NOTE));
});
