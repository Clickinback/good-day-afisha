import assert from "node:assert/strict";
import test from "node:test";
import { createAdminToken, validateAdminToken } from "./admin-session-token";

const password = "a-secure-admin-password";
const secret = "a-secure-auth-secret-that-is-long-enough";
const now = Date.UTC(2026, 8, 4, 12);

test("accepts a fresh admin session token", () => {
  const token = createAdminToken(password, secret, now);
  assert.equal(validateAdminToken(token, password, secret, now), true);
});

test("rejects expired, modified, and rotated admin session tokens", () => {
  const token = createAdminToken(password, secret, now);
  assert.equal(validateAdminToken(token, password, secret, now + 8 * 60 * 60 * 1000), false);
  assert.equal(validateAdminToken(`${token}x`, password, secret, now), false);
  assert.equal(validateAdminToken(token, `${password}-rotated`, secret, now), false);
  assert.equal(validateAdminToken(token, password, `${secret}-rotated`, now), false);
});
