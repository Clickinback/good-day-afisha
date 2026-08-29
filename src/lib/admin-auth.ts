import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "good-day-admin";

function signature() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  if (!password || !secret || secret.length < 32) return null;
  return createHmac("sha256", secret).update(password).digest("hex");
}

export function isValidAdminToken(value?: string) {
  const expected = signature();
  if (!value || !expected || value.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(value), Buffer.from(expected));
}

export async function isAdmin() {
  return isValidAdminToken((await cookies()).get(COOKIE)?.value);
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function createAdminSession() {
  const value = signature();
  if (!value) throw new Error("ADMIN_PASSWORD и AUTH_SECRET должны быть настроены");
  (await cookies()).set(COOKIE, value, { httpOnly:true, secure:process.env.NODE_ENV==="production", sameSite:"strict", path:"/", maxAge:60*60*8 });
}

export async function destroyAdminSession() {
  (await cookies()).delete(COOKIE);
}
