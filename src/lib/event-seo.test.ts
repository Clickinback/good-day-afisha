import assert from "node:assert/strict";
import test from "node:test";
import type { Event } from "@/modules/events/types";
import { buildEventStructuredData } from "./event-seo";

const event: Event = {
  id: "event-1", slug: "concert", title: "Концерт", shortDescription: "Большой концерт", description: "Описание",
  imageUrl: "/media/concert.jpg", city: { slug: "polotsk", name: "Полоцк", preposition: "в Полоцке" },
  venue: "Дворец культуры", address: "ул. Ленина, 1", startsAt: "2026-09-20T16:00:00.000Z",
  category: { slug: "concerts", name: "Концерты", icon: "music" }, priceMin: 25, priceMax: 40,
  isFree: false, ageRestriction: "12+", ticketUrl: "https://tickets.example/concert", currency: "BYN",
  organizer: { name: "Good Day", websiteUrl: "https://good-day.by" }, status: "PUBLISHED",
};

test("builds absolute Event and BreadcrumbList structured data", () => {
  const data = buildEventStructuredData(event, "https://afisha.good-day.by");
  const schemaEvent = data["@graph"][0] as { url: string; image: string[]; organizer?: { name: string }; offers?: { price: number } };
  const breadcrumbs = data["@graph"][1] as { itemListElement: { item: string }[] };
  assert.equal(schemaEvent.url, "https://afisha.good-day.by/polotsk/events/concert");
  assert.deepEqual(schemaEvent.image, ["https://afisha.good-day.by/media/concert.jpg"]);
  assert.equal(schemaEvent.organizer?.name, "Good Day");
  assert.equal(schemaEvent.offers?.price, 25);
  assert.equal(breadcrumbs.itemListElement.at(-1)?.item, schemaEvent.url);
});

test("does not claim an unknown paid event is free", () => {
  const data = buildEventStructuredData({ ...event, priceMin: null, ticketUrl: undefined }, "https://afisha.good-day.by");
  assert.equal("offers" in data["@graph"][0], false);
});

test("publishes zero price for explicitly free events", () => {
  const data = buildEventStructuredData({ ...event, isFree: true, priceMin: null }, "https://afisha.good-day.by");
  const schemaEvent = data["@graph"][0] as { offers?: { price: number } };
  assert.equal(schemaEvent.offers?.price, 0);
});
