import { endOfDay, endOfWeek, isWithinInterval, startOfDay, startOfTomorrow } from "date-fns";
import type { Prisma } from "@prisma/client";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { cities, events } from "./demo";
import type { City, Event, EventFilters } from "@/modules/events/types";

const fallbackImage = "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=1400&q=80";
const eventInclude = { city: true, venue: true, category: true, occurrences: { orderBy: { startsAt: "asc" as const } } };
type DbEventBase = Prisma.EventGetPayload<{ include: { city: true; venue: true; category: true } }>;
type DbEvent = DbEventBase & { occurrences?: Prisma.EventOccurrenceGetPayload<Record<string, never>>[] };
const preposition = (name: string) => name === "Полоцк" ? "в Полоцке" : name === "Новополоцк" ? "в Новополоцке" : `в ${name}`;
const demoCity = (slug: string) => cities.find((city) => city.slug === slug);
const demoEvent = (slug: string) => events.find((event) => event.slug === slug);

function filterDemo(filters: EventFilters = {}) {
  const now = new Date();
  return events.filter((event) => {
    const date = new Date(event.startsAt);
    if (filters.city && event.city.slug !== filters.city) return false;
    if (filters.category && event.category.slug !== filters.category) return false;
    if (filters.free && !event.isFree) return false;
    if (filters.kids && event.category.slug !== "kids" && event.ageRestriction !== "0+") return false;
    if (filters.q && !`${event.title} ${event.venue} ${event.shortDescription}`.toLowerCase().includes(filters.q.toLowerCase())) return false;
    if (filters.period === "today" && !isWithinInterval(date, { start: startOfDay(now), end: endOfDay(now) })) return false;
    if (filters.period === "tomorrow" && !isWithinInterval(date, { start: startOfTomorrow(), end: endOfDay(startOfTomorrow()) })) return false;
    if (filters.period === "weekend" && !isWithinInterval(date, { start: now, end: endOfWeek(now, { weekStartsOn: 1 }) })) return false;
    return true;
  }).sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt));
}

export function mapEvent(row: DbEvent): Event {
  return {
    id: row.id, slug: row.slug, title: row.title,
    shortDescription: row.shortDescription ?? row.description ?? "Подробности события уточняются.",
    description: row.description ?? row.shortDescription ?? "Подробности события уточняются.",
    imageUrl: row.imageUrl ?? fallbackImage,
    city: { slug: row.city.slug, name: row.city.name, preposition: preposition(row.city.name) },
    venue: row.venue?.name ?? "Место уточняется",
    address: row.address ?? row.venue?.address ?? "Адрес уточняется",
    startsAt: row.startsAt.toISOString(), timeTbd: row.timeTbd, endsAt: row.endsAt?.toISOString(),
    category: { slug: row.category.slug, name: row.category.name, icon: row.category.icon ?? "calendar" },
    priceMin: row.priceMin === null ? null : Number(row.priceMin),
    priceMax: row.priceMax === null ? null : Number(row.priceMax),
    isFree: row.isFree, ageRestriction: row.ageRestriction ?? "Возраст уточняется",
    ticketUrl: row.ticketUrl ?? undefined, featured: row.isFeatured, status: row.status,
    occurrences: (row.occurrences ?? []).map((item) => ({
      startsAt: item.startsAt.toISOString(), endsAt: item.endsAt?.toISOString(),
      price: item.price === null ? null : Number(item.price), ticketUrl: item.ticketUrl ?? undefined,
    })),
  };
}

export const getPublicCity = cache(async (slug: string): Promise<City | undefined> => {
  try {
    const city = await prisma.city.findFirst({ where: { slug, active: true } });
    return city ? { slug: city.slug, name: city.name, preposition: preposition(city.name) } : undefined;
  } catch { return demoCity(slug); }
});

export async function getPublicEvents(filters: EventFilters = {}): Promise<Event[]> {
  const now = new Date();
  let from = now;
  if (filters.period === "today") from = startOfDay(now);
  if (filters.period === "tomorrow") from = startOfTomorrow();
  let to: Date | undefined;
  if (filters.period === "today") to = endOfDay(now);
  if (filters.period === "tomorrow") to = endOfDay(startOfTomorrow());
  if (filters.period === "weekend") to = endOfWeek(now, { weekStartsOn: 1 });
  try {
    const rows = await prisma.event.findMany({
      where: {
        status: "PUBLISHED", startsAt: { gte: from, ...(to ? { lte: to } : {}) },
        ...(filters.city ? { city: { slug: filters.city } } : {}),
        ...(filters.category ? { category: { slug: filters.category } } : {}),
        ...(filters.free ? { isFree: true } : {}),
        ...(filters.kids ? { OR: [{ category: { slug: "kids" } }, { ageRestriction: "0+" }] } : {}),
        ...(filters.q ? { OR: [
          { title: { contains: filters.q, mode: "insensitive" as const } },
          { description: { contains: filters.q, mode: "insensitive" as const } },
          { venue: { name: { contains: filters.q, mode: "insensitive" as const } } },
        ] } : {}),
      },
      include: eventInclude, orderBy: { startsAt: "asc" }, take: 200,
    });
    return rows.map(mapEvent);
  } catch { return filterDemo(filters); }
}

export const getPublicEvent = cache(async (slug: string): Promise<Event | undefined> => {
  try {
    const row = await prisma.event.findFirst({
      where: { slug, status: { in: ["PUBLISHED", "FINISHED", "CANCELLED"] } },
      include: eventInclude,
    });
    return row ? mapEvent(row) : undefined;
  } catch { return demoEvent(slug); }
});

export async function getSitemapEvents() {
  try {
    return await prisma.event.findMany({
      where: { status: { in: ["PUBLISHED", "FINISHED", "CANCELLED"] } },
      select: { slug: true, updatedAt: true, status: true, city: { select: { slug: true } } },
      orderBy: { updatedAt: "desc" }, take: 5000,
    });
  } catch {
    return events.map((event) => ({ slug: event.slug, updatedAt: new Date(event.startsAt), status: "PUBLISHED" as const, city: { slug: event.city.slug } }));
  }
}
