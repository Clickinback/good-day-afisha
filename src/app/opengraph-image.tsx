import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public", "brand", "good-day-logo.png"));
  const logoSrc = "data:image/png;base64," + logo.toString("base64");
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", padding: 70, background: "#f5f2ea", color: "#171713", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <img src={logoSrc} width={88} height={88} alt="" />
          <div style={{ display: "flex", flexDirection: "column", color: "#3561f4", fontWeight: 900 }}>
            <span style={{ fontSize: 34, letterSpacing: -1 }}>GOOD DAY</span>
            <span style={{ fontSize: 13, letterSpacing: 8 }}>АФИША</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 950 }}>
          <span style={{ display: "flex", color: "#3561f4", fontSize: 22, textTransform: "uppercase", letterSpacing: 5 }}>Полоцк · Новополоцк</span>
          <strong style={{ display: "flex", flexDirection: "column", fontSize: 74, lineHeight: 1.02, letterSpacing: -3, marginTop: 22 }}>
            <span style={{ display: "flex" }}>Твой город.</span>
            <span style={{ display: "flex" }}>Твой хороший день.</span>
          </strong>
        </div>
        <div style={{ display: "flex", fontSize: 22, color: "#6f6b62" }}>Концерты · кино · театр · события рядом</div>
      </div>
      <div style={{ position: "absolute", right: -90, top: -90, width: 330, height: 330, borderRadius: 999, background: "#3561f4" }} />
      <div style={{ position: "absolute", right: 110, bottom: -105, width: 230, height: 230, borderRadius: 999, background: "#d7f45a" }} />
    </div>,
    size,
  );
}
