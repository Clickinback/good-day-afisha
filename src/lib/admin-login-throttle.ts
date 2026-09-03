import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;

async function clientHash() {
  const requestHeaders = await headers();
  const forwarded = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = (forwarded || requestHeaders.get("x-real-ip") || "unknown").slice(0, 200);
  const secret = process.env.AUTH_SECRET || "missing-auth-secret";
  return createHmac("sha256", secret).update(address).digest("hex");
}

export async function getAdminLoginLockSeconds() {
  const record = await prisma.adminLoginThrottle.findUnique({ where: { clientHash: await clientHash() } });
  if (!record?.lockedUntil) return 0;
  return Math.max(0, Math.ceil((record.lockedUntil.getTime() - Date.now()) / 1000));
}

export async function recordAdminLoginFailure() {
  const hash = await clientHash();
  const now = new Date();
  const windowBoundary = new Date(now.getTime() - WINDOW_MS);

  await prisma.$transaction(async (tx) => {
    const current = await tx.adminLoginThrottle.findUnique({ where: { clientHash: hash } });
    const failedCount = !current || current.windowStartedAt < windowBoundary ? 1 : current.failedCount + 1;
    const windowStartedAt = !current || current.windowStartedAt < windowBoundary ? now : current.windowStartedAt;
    const lockedUntil = failedCount >= MAX_FAILURES ? new Date(now.getTime() + LOCK_MS) : null;

    await tx.adminLoginThrottle.upsert({
      where: { clientHash: hash },
      create: { clientHash: hash, failedCount, windowStartedAt, lockedUntil },
      update: { failedCount, windowStartedAt, lockedUntil },
    });
  });
}

export async function clearAdminLoginFailures() {
  await prisma.adminLoginThrottle.deleteMany({ where: { clientHash: await clientHash() } });
}
