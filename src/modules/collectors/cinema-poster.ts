import * as cheerio from "cheerio";
import { isPersistableImageUrl } from "./image-storage";

// Only select a poster supplied by this film page, never invent a URL.
export function extractCinemaPoster(html: string, pageUrl: string): string | undefined {
  if (new URL(pageUrl).hostname !== "hubl.by") return undefined;
  const $ = cheerio.load(html);
  const title = $("h1").first().text().trim().toLocaleLowerCase();
  if (!title) return undefined;
  for (const element of $("img").toArray()) {
    const image = $(element);
    if (image.attr("alt")?.trim().toLocaleLowerCase() !== title) continue;
    const width = Number(image.attr("width"));
    const height = Number(image.attr("height"));
    const portrait = width > 0 && height > width * 1.15;
    const posterHint = /poster/i.test(`${image.attr("class") ?? ""} ${image.attr("src") ?? ""}`);
    if (!portrait && !(posterHint && !(width > 0 && height > 0 && width >= height))) continue;
    for (const value of [image.attr("data-src"), image.attr("src")]) {
      if (!value) continue;
      const url = new URL(value, pageUrl).toString();
      if (isPersistableImageUrl(url)) return url;
    }
  }
  return undefined;
}
