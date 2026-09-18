import * as cheerio from "cheerio";
import { extractCinemaPoster } from "./cinema-poster";
import { isPersistableImageUrl } from "./image-storage";

type JsonLdNode = Record<string, unknown>;
export type CinemaDetails = {
  description?: string;
  venueName?: string;
  address?: string;
  ageRestriction?: string;
  imageUrl?: string;
};

function nodes(value: unknown): JsonLdNode[] {
  if (Array.isArray(value)) return value.flatMap(nodes);
  if (!value || typeof value !== "object") return [];
  const node = value as JsonLdNode;
  return [node, ...Object.values(node).flatMap(nodes)];
}

function plainText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const text = cheerio.load(value).text().replace(/\s+/g, " ").trim();
  return text || undefined;
}

function imageUrl(value: unknown, pageUrl: string): string | undefined {
  const candidate = Array.isArray(value) ? value[0] : value;
  const path = typeof candidate === "string" ? candidate : candidate && typeof candidate === "object" && "url" in candidate ? candidate.url : null;
  if (typeof path !== "string") return undefined;
  try {
    const url = new URL(path, pageUrl).toString();
    return isPersistableImageUrl(url) && !/placeholder|no[-_]?image|default/i.test(url) ? url : undefined;
  } catch { return undefined; }
}

export function extractCinemaDetails(html: string, pageUrl: string): CinemaDetails {
  let url: URL;
  try { url = new URL(pageUrl); } catch { return {}; }
  if (url.origin !== "https://hubl.by" || !/^\/novopolock\/kino\/[^/]+\/?$/.test(url.pathname)) return {};

  const $ = cheerio.load(html);
  const title = $("h1").first().text().replace(/\s+/g, " ").trim();
  if (!title) return {};
  const structured: JsonLdNode[] = [];
  $('script[type="application/ld+json"]').each((_, element) => {
    try { structured.push(...nodes(JSON.parse($(element).text()))); } catch { /* Ignore malformed structured data. */ }
  });
  const filmNodes = structured.filter(node => {
    const types = Array.isArray(node["@type"]) ? node["@type"] : [node["@type"]];
    return types.some(type => type === "Movie" || type === "Event" || type === "ScreeningEvent") &&
      (typeof node.name !== "string" || node.name.trim().toLocaleLowerCase() === title.toLocaleLowerCase());
  });

  const bodyText = $("body").text().replace(/\s+/g, " ");
  let description = filmNodes.map(node => plainText(node.description)).find(text => text && text.length >= 40);
  if (!description) {
    const heading = $("h2,h3").filter((_, element) => $(element).text().trim() === "Описание").first();
    const sections = [heading.closest("section,article"), heading.parent(), heading.parent().parent()];
    for (const section of sections) {
      if (!section.length) continue;
      description = section.find("p").toArray().map(element => plainText($(element).text())).find(text => text && text.length >= 40);
      if (description) break;
    }
  }
  if (!description && bodyText.includes("Читать ещё")) {
    const beforeReadMore = bodyText.split("Читать ещё")[0];
    const marker = beforeReadMore.lastIndexOf("Описание");
    const candidate = marker >= 0 ? beforeReadMore.slice(marker + "Описание".length).trim() : "";
    if (candidate.length >= 40 && candidate.length <= 4000 && !candidate.includes("Сеансы в городе")) description = candidate;
  }

  const hasMinskCinema = /Кинотеатр\s*["«]?Минск["»]?\s*\(Новополоцк\)/i.test(bodyText);
  const hasMinskAddress = /ул\.?\s*Молод[её]жная,?\s*152/i.test(bodyText);
  const headerText = bodyText.split("Описание")[0].slice(0, 1500);
  const age = headerText.match(/\b(0|6|12|16|18)\+/)?.[0];
  const fallbackImage = $("img").toArray().map(element => {
      const image = $(element);
      return image.attr("alt")?.trim().toLocaleLowerCase() === title.toLocaleLowerCase()
        ? [image.attr("data-src"), image.attr("src")].map(value => imageUrl(value, pageUrl)).find(Boolean) : undefined;
    }).find(Boolean) ?? filmNodes.map(node => imageUrl(node.image, pageUrl)).find(Boolean);

  return {
    description: description?.slice(0, 4000),
    venueName: hasMinskCinema ? "Кинотеатр «Минск»" : undefined,
    address: hasMinskCinema && hasMinskAddress ? "г. Новополоцк, ул. Молодёжная, 152" : undefined,
    ageRestriction: age,
    imageUrl: extractCinemaPoster(html, pageUrl) ?? fallbackImage,
  };
}
