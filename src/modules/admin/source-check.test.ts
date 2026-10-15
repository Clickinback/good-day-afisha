import test from 'node:test';
import assert from 'node:assert/strict';
import { createSourceCheck, validateSourceCheck, needsSourceCheck } from './source-check';

const secret = 'test-only-secret'.repeat(4);
const setup = { url: 'https://t.me/s/example', type: 'TELEGRAM', collectionMethod: 'TELEGRAM', config: { maxItems: 20, includeForwarded: false } };
const now = Date.UTC(2026, 9, 15);

test('successful preview proof is bound to URL, type, method and config, not JSON key order', () => {
  const token = createSourceCheck(setup, secret, now);
  assert.equal(validateSourceCheck(token, setup, secret, now), true);
  assert.equal(validateSourceCheck(token, { ...setup, config: { includeForwarded: false, maxItems: 20 } }, secret, now), true);
  for (const change of [{ url: 'https://t.me/s/another' }, { type: 'WEBSITE' }, { collectionMethod: 'HTML' }, { config: { maxItems: 100 } }]) assert.equal(validateSourceCheck(token, { ...setup, ...change }, secret, now), false);
  assert.equal(validateSourceCheck(token, setup, 'other'.repeat(10), now), false);
  assert.equal(validateSourceCheck(token, setup, secret, now + 30 * 60 * 1000), false);
  assert.equal(validateSourceCheck('fake', setup, secret, now), false);
});

test('activation requires preview but unchanged active sources and inactive drafts do not', () => {
  assert.equal(needsSourceCheck(true, setup), true);
  assert.equal(needsSourceCheck(false, setup), false);
  assert.equal(needsSourceCheck(true, setup, { ...setup, active: false }), true);
  assert.equal(needsSourceCheck(true, setup, { ...setup, active: true }), false);
  assert.equal(needsSourceCheck(true, { ...setup, url: 'https://example.com' }, { ...setup, active: true }), true);
});
