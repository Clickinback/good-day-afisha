import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { processRawEventBatch } from "@/modules/ai-parser/service";
import { generateCollections } from "@/modules/collections/service";
import { collectActiveSources } from "@/modules/collectors/service";
import { recordSystemError } from "@/modules/collectors/errors";
import { deduplicateBatch } from "@/modules/deduplication/service";
import { runLifecycle } from "@/modules/lifecycle/service";
import { evaluatePublicationBatch } from "@/modules/publication/service";

const PIPELINE_KEY = "good-day-automation";
const LEASE_MS = 2 * 60 * 60 * 1000;

export type AutomationStep = {
  name: string;
  status: "SUCCEEDED" | "WARNING" | "SKIPPED" | "FAILED";
  durationMs: number;
  summary?: Record<string, unknown>;
  error?: string;
};

export type AutomationResult = {
  runId?: string;
  status: "SUCCEEDED" | "PARTIAL" | "FAILED" | "LOCKED";
  startedAt: string;
  finishedAt: string;
  steps: AutomationStep[];
};

async function acquireLock(ownerId: string) {
  const expiresAt = new Date(Date.now() + LEASE_MS);
  await prisma.$executeRawUnsafe(
    'INSERT INTO "AutomationLock" ("key", "ownerId", "expiresAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW()) ON CONFLICT ("key") DO NOTHING',
    PIPELINE_KEY, ownerId, expiresAt,
  );
  const rows = await prisma.$queryRawUnsafe<Array<{ key: string }>>(
    'UPDATE "AutomationLock" SET "ownerId" = $1, "expiresAt" = $2, "updatedAt" = NOW() WHERE "key" = $3 AND ("ownerId" = $1 OR "expiresAt" < NOW()) RETURNING "key"',
    ownerId, expiresAt, PIPELINE_KEY,
  );
  return rows.length === 1;
}

async function releaseLock(ownerId: string) {
  await prisma.$executeRawUnsafe(
    'DELETE FROM "AutomationLock" WHERE "key" = $1 AND "ownerId" = $2',
    PIPELINE_KEY, ownerId,
  );
}

async function executeStep(
  steps: AutomationStep[],
  name: string,
  operation: () => Promise<{ status?: AutomationStep["status"]; summary?: Record<string, unknown> }>,
  onProgress?: () => Promise<void>,
) {
  const started = Date.now();
  try {
    const result = await operation();
    steps.push({ name, status: result.status ?? "SUCCEEDED", durationMs: Date.now() - started, summary: result.summary });
    await onProgress?.();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    steps.push({ name, status: "FAILED", durationMs: Date.now() - started, error: message });
    await recordSystemError("automation", name, error);
    await onProgress?.();
  }
}

export async function runAutomationPipeline(trigger = "manual"): Promise<AutomationResult> {
  const startedAt = new Date();
  if (trigger === "admin") {
    const recent = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      'SELECT COUNT(*)::bigint AS "count" FROM "AutomationRun" WHERE "trigger" = $1 AND "startedAt" > NOW() - INTERVAL \'1 minute\'',
      "admin",
    );
    if (Number(recent[0]?.count ?? 0) > 0) {
      const finishedAt = new Date();
      return { status: "LOCKED", startedAt: startedAt.toISOString(), finishedAt: finishedAt.toISOString(), steps: [] };
    }
  }
  const ownerId = randomUUID();
  if (!(await acquireLock(ownerId))) {
    const finishedAt = new Date();
    return { status: "LOCKED", startedAt: startedAt.toISOString(), finishedAt: finishedAt.toISOString(), steps: [] };
  }

  const runId = randomUUID();
  const steps: AutomationStep[] = [];
  await prisma.$executeRawUnsafe(
    'INSERT INTO "AutomationRun" ("id", "status", "trigger", "startedAt", "createdAt") VALUES ($1, $2, $3, $4, NOW())',
    runId, "RUNNING", trigger.slice(0, 100), startedAt,
  );
  const saveProgress = async () => {
    await prisma.$executeRawUnsafe(
      'UPDATE "AutomationRun" SET "steps" = CAST($1 AS jsonb) WHERE "id" = $2',
      JSON.stringify(steps), runId,
    );
  };

  try {
    await executeStep(steps, "collectSources", async () => {
      const results = await collectActiveSources();
      const failed = results.filter((item) => item.status === "FAILED").length;
      return {
        status: failed ? "WARNING" : "SUCCEEDED",
        summary: {
          sources: results.length,
          failed,
          found: results.reduce((sum, item) => sum + item.foundCount, 0),
          created: results.reduce((sum, item) => sum + item.createdCount, 0),
        },
      };
    }, saveProgress);

    await executeStep(steps, "processRawEvents", async () => {
      if (!process.env.OPENAI_API_KEY || !process.env.OPENAI_EVENT_PARSER_MODEL) {
        return { status: "SKIPPED", summary: { reason: "OPENAI_API_KEY или OPENAI_EVENT_PARSER_MODEL не настроен" } };
      }
      const results = await processRawEventBatch(50);
      const failed = results.filter((item) => item.status === "FAILED").length;
      return { status: failed ? "WARNING" : "SUCCEEDED", summary: { processed: results.length, failed } };
    }, saveProgress);

    await executeStep(steps, "detectDuplicates", async () => {
      const results = await deduplicateBatch(100);
      const counts = results.reduce<Record<string, number>>((acc, item) => {
        acc[item.decision] = (acc[item.decision] ?? 0) + 1;
        return acc;
      }, {});
      return { summary: { processed: results.length, ...counts } };
    }, saveProgress);

    await executeStep(steps, "publishEvents", async () => {
      const results = await evaluatePublicationBatch(200);
      return {
        summary: {
          evaluated: results.length,
          published: results.filter((item) => item.status === "PUBLISHED").length,
          moderation: results.filter((item) => item.status === "PENDING").length,
        },
      };
    }, saveProgress);

    await executeStep(steps, "updateExpiredEvents", async () => ({ summary: await runLifecycle() }), saveProgress);
    await executeStep(steps, "generateCollections", async () => {
      const results = await generateCollections();
      return { summary: { collections: results.length, events: results.reduce((sum, item) => sum + item.count, 0) } };
    }, saveProgress);

    const failed = steps.filter((step) => step.status === "FAILED").length;
    const warnings = steps.filter((step) => step.status === "WARNING").length;
    const status: AutomationResult["status"] = failed === steps.length ? "FAILED" : failed || warnings ? "PARTIAL" : "SUCCEEDED";
    const finishedAt = new Date();
    const errorMessage = steps.filter((step) => step.error).map((step) => step.name + ": " + step.error).join("\n") || null;
    await prisma.$executeRawUnsafe(
      'UPDATE "AutomationRun" SET "status" = $1, "finishedAt" = $2, "steps" = CAST($3 AS jsonb), "errorMessage" = $4 WHERE "id" = $5',
      status, finishedAt, JSON.stringify(steps), errorMessage, runId,
    );
    return { runId, status, startedAt: startedAt.toISOString(), finishedAt: finishedAt.toISOString(), steps };
  } catch (error) {
    const finishedAt = new Date();
    const message = error instanceof Error ? error.message : String(error);
    await prisma.$executeRawUnsafe(
      'UPDATE "AutomationRun" SET "status" = $1, "finishedAt" = $2, "steps" = CAST($3 AS jsonb), "errorMessage" = $4 WHERE "id" = $5',
      "FAILED", finishedAt, JSON.stringify(steps), message, runId,
    );
    await recordSystemError("automation", "pipeline", error, { runId });
    return { runId, status: "FAILED", startedAt: startedAt.toISOString(), finishedAt: finishedAt.toISOString(), steps };
  } finally {
    await releaseLock(ownerId);
  }
}
