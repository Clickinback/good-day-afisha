import type { Event } from "@/modules/events/types";

export function splitRecommendedEvents(events: Event[], limit = 3) {
  const featured = events.filter((event) => event.featured).slice(0, limit);
  const recommended = featured.length ? featured : events.slice(0, limit);
  const recommendedIds = new Set(recommended.map((event) => event.id));
  return { recommended, remaining: events.filter((event) => !recommendedIds.has(event.id)) };
}

export function selectFallbackEvents(events: Event[], limit = 8) {
  return [...events].sort((a, b) => {
    const cinemaDifference = Number(b.category.slug === "cinema") - Number(a.category.slug === "cinema");
    return cinemaDifference || +new Date(a.startsAt) - +new Date(b.startsAt);
  }).slice(0, limit);
}
