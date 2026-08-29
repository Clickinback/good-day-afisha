import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getPublicEvent } from "@/data/events";
import { formatEventDate, formatPrice } from "@/lib/format";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await getPublicEvent(decodeURIComponent(slug));
  const logo = await readFile(join(process.cwd(), "public", "brand", "good-day-logo.png"));
  const logoSrc = "data:image/png;base64," + logo.toString("base64");
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", padding: 68, background: "#f5f2ea", color: "#171713", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={logoSrc} width={70} height={70} alt="" />
          <div style={{ display: "flex", color: "#3561f4", fontSize: 25, fontWeight: 900, letterSpacing: 1 }}>GOOD DAY АФИША</div>
          <div style={{ display: "flex", marginLeft: "auto", padding: "12px 18px", borderRadius: 999, background: "#d7f45a", fontSize: 19, fontWeight: 800 }}>{event?.category.name ?? "Событие"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 1030 }}>
          <div style={{ display: "flex", color: "#3561f4", fontSize: 22, textTransform: "uppercase", letterSpacing: 4 }}>{event?.city.name ?? "Полоцк и Новополоцк"}</div>
          <div style={{ display: "flex", fontSize: 66, fontWeight: 900, lineHeight: 1.03, letterSpacing: -3, marginTop: 18 }}>{event?.title ?? "События рядом"}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22, fontSize: 23 }}>
          <strong style={{ display: "flex" }}>{event ? formatEventDate(event.startsAt) : "Актуальная афиша"}</strong>
          <span style={{ display: "flex", color: "#777269" }}>·</span>
          <span style={{ display: "flex" }}>{event?.venue ?? "Полоцк и Новополоцк"}</span>
          {event && <span style={{ display: "flex", marginLeft: "auto", color: "#3561f4", fontWeight: 900 }}>{formatPrice(event.isFree, event.priceMin, event.priceMax)}</span>}
        </div>
      </div>
      <div style={{ position: "absolute", right: -115, top: 125, width: 320, height: 320, borderRadius: 999, background: "#3561f4", opacity: .12 }} />
    </div>,
    size,
  );
}
