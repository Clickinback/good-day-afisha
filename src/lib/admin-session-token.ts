import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

function signingKey(password: string, secret: string) {
  return createHmac("sha256", secret).update(password).digest();
}

function sign(payload: string, password: string, secret: string) {
  return createHmac("sha256", signingKey(password, secret)).update(payload).digest("base64url");
}

export function createAdminToken(password: string, secret: string, nowMs = Date.now()) {
  const expiresAt = Math.floor(nowMs / 1000) + ADMIN_SESSION_SECONDS;
  const payload = `${expiresAt}.${randomBytes(24).toString("base64url")}`;
  return `${payload}.${sign(payload, password, secret)}`;
}

export function validateAdminToken(token: string | undefined, password: string, secret: string, nowMs = Date.now()) {
  if (!token) return false;
  const [expiresText, nonce, signature, ...extra] = token.split(".");
  if (!expiresText || !nonce || !signature || extra.length > 0) return false;

  const expiresAt = Number(expiresText);
  const nowSeconds = Math.floor(nowMs / 1000);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= nowSeconds || expiresAt > nowSeconds + ADMIN_SESSION_SECONDS) {
    return false;
  }

  const expected = sign(`${expiresText}.${nonce}`, password, secret);
  if (signature.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
