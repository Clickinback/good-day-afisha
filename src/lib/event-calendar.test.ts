import assert from "node:assert/strict";
import test from "node:test";
import type { Event } from "@/modules/events/types";
import { buildGoogleCalendarUrl, buildIcsDataUrl, buildMapUrl } from "./event-calendar";

const event: Event = {
  id: "event-1", slug: "concert", title: "Джаз, музыка", shortDescription: "Вечер; под открытым небом", description: "Описание",
  imageUrl: "/concert.jpg", city: { slug: "polotsk", name: "Полоцк", preposition: "в Полоцке" },
  venue: "Софийский собор", address: "ул. Замковая, 1", startsAt: "2026-09-20T16:00:00.000Z",
  category: { slug: "concerts", name: "Концерты", icon: "music" }, priceMin: 25, isFree: false, ageRestriction: "12+",
};

test("builds a Google Calendar link with event details", () => {
  const url = new URL(buildGoogleCalendarUrl(event, "https://afisha.good-day.by/polotsk/events/concert"));
  assert.equal(url.searchParams.get("text"), event.title);
  assert.equal(url.searchParams.get("dates"), "20260920T160000Z/20260920T180000Z");
  assert.match(url.searchParams.get("location") ?? "", /Софийский собор/);
});

test("builds an escaped downloadable calendar event", () => {
  const dataUrl = buildIcsDataUrl(event, "https://afisha.good-day.by/polotsk/events/concert");
  const content = decodeURIComponent(dataUrl.split(",", 2)[1]);
  assert.match(content, /SUMMARY:Джаз\\, музыка/);
  assert.match(content, /DESCRIPTION:Вечер\\; под открытым небом/);
  assert.match(content, /DTSTART:20260920T160000Z/);
});

test("builds an all-day calendar entry when time is unknown", () => {
  const url = new URL(buildGoogleCalendarUrl({ ...event, startsAt: "2026-09-17T21:00:00.000Z", timeTbd: true }, "https://afisha.good-day.by/event"));
  assert.equal(url.searchParams.get("dates"), "20260918/20260919");
});

test("builds a map search from venue and address", () => {
  assert.match(decodeURIComponent(buildMapUrl(event)), /Софийский собор, ул. Замковая, 1, Полоцк/);
});
