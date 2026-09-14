import assert from "node:assert/strict";
import test from "node:test";
import type { Event } from "@/modules/events/types";
import { selectFallbackEvents, splitRecommendedEvents } from "./recommendations";

const event = (id: string, featured = false) => ({ id, featured } as Event);

test("prefers editorially featured events without duplicating them", () => {
  const result = splitRecommendedEvents([event("1"), event("2", true), event("3"), event("4", true)]);
  assert.deepEqual(result.recommended.map(({ id }) => id), ["2", "4"]);
  assert.deepEqual(result.remaining.map(({ id }) => id), ["1", "3"]);
});

test("falls back to the nearest events when none are featured", () => {
  const result = splitRecommendedEvents([event("1"), event("2"), event("3"), event("4")]);
  assert.deepEqual(result.recommended.map(({ id }) => id), ["1", "2", "3"]);
  assert.deepEqual(result.remaining.map(({ id }) => id), ["4"]);
});

test("prioritizes cinema in empty-filter recommendations", () => {
  const concert = { ...event("1"), startsAt: "2026-09-15T10:00:00Z", category: { slug: "concerts" } } as Event;
  const cinema = { ...event("2"), startsAt: "2026-09-16T10:00:00Z", category: { slug: "cinema" } } as Event;
  assert.deepEqual(selectFallbackEvents([concert, cinema]).map(({ id }) => id), ["2", "1"]);
});
