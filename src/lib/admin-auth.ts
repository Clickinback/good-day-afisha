import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_SECONDS, createAdminToken, validateAdminToken } from "@/lib/admin-session-token";

const COOKIE = "good-day-admin";

function credentials() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!password || !secret || secret.length < 32) return null;
  return { password, secret };
}

export function isValidAdminToken(value?: string) {
  const configured = credentials();
  return configured ? validateAdminToken(value, configured.password, configured.secret) : false;
}

export function isValidAdminPassword(value: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const actualHash = createHash("sha256").update(value).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(actualHash, expectedHash);
}

export async function isAdmin() {
  return isValidAdminToken((await cookies()).get(COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function createAdminSession() {
  const configured = credentials();
  if (!configured) throw new Error("ADMIN_PASSWORD и AUTH_SECRET должны быть настроены");
  const value = createAdminToken(configured.password, configured.secret);
  (await cookies()).set(COOKIE, value, { httpOnly:true, secure:process.env.NODE_ENV==="production", sameSite:"strict", path:"/", maxAge:ADMIN_SESSION_SECONDS, priority:"high" });
}

export async function destroyAdminSession() {
  (await cookies()).delete(COOKIE);
}
