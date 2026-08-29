import { runAutomationPipeline } from "@/modules/automation/service";

export const maxDuration = 300;

export async function POST(request: Request) {
  const secret = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return Response.json({ error: { code: "UNAUTHORIZED" } }, { status: 401 });
  }
  const result = await runAutomationPipeline("cron");
  if (result.status === "LOCKED") {
    return Response.json({ error: { code: "PIPELINE_ALREADY_RUNNING" }, data: result }, { status: 409 });
  }
  return Response.json({ data: result }, { status: result.status === "FAILED" ? 500 : 200 });
}

