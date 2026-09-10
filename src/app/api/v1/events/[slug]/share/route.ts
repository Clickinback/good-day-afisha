import { z } from "zod";
import { recordEventShare } from "@/lib/share-analytics-data";
import { hasSameHostOrigin, shareChannels } from "@/lib/share-analytics";

const inputSchema = z.object({ channel: z.enum(shareChannels) }).strict();

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!hasSameHostOrigin(request)) return Response.json({ error: { code: "INVALID_ORIGIN" } }, { status: 403 });
  if (Number(request.headers.get("content-length") ?? 0) > 256) return Response.json({ error: { code: "PAYLOAD_TOO_LARGE" } }, { status: 413 });
  const input = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: { code: "INVALID_REQUEST" } }, { status: 400 });
  try {
    const recorded = await recordEventShare(decodeURIComponent((await params).slug), parsed.data.channel);
    return new Response(null, { status: recorded ? 204 : 404 });
  } catch {
    return Response.json({ error: { code: "ANALYTICS_UNAVAILABLE" } }, { status: 503 });
  }
}
