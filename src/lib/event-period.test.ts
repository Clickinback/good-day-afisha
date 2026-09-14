import assert from "node:assert/strict";
import test from "node:test";
import { eventPeriodRange } from "./event-period";

test("uses Minsk calendar boundaries for tomorrow", () => {
  const range = eventPeriodRange("tomorrow", new Date("2026-09-14T22:30:00Z"));
  assert.equal(range.from.toISOString(), "2026-09-15T21:00:00.000Z");
  assert.equal(range.to?.toISOString(), "2026-09-16T20:59:59.999Z");
});

test("starts unfiltered listings at the current moment", () => {
  const now = new Date("2026-09-14T12:00:00Z");
  assert.deepEqual(eventPeriodRange(undefined, now), { from: now, to: undefined });
});
