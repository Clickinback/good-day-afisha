import { z } from "zod";
import { engagementActions } from "@/lib/event-engagement";
import { recordEventEngagement } from "@/lib/share-analytics-data";
import { hasSameHostOrigin } from "@/lib/share-analytics";

const inputSchema = z.object({ action: z.enum(engagementActions) }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!hasSameHostOrigin(request)) return Response.json({ error: { code: "INVALID_ORIGIN" } }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 256) return Response.json({ error: { code: "PAYLOAD_TOO_LARGE" } }, { status: 413 });
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: { code: "INVALID_REQUEST" } }, { status: 400 });
  try {
    const recorded = await recordEventEngagement(decodeURIComponent((await params).slug), parsed.data.action);
    return new Response(null, { status: recorded ? 204 : 404 });
  } catch {
    return Response.json({ error: { code: "ANALYTICS_UNAVAILABLE" } }, { status: 503 });
  }
}
