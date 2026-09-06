import assert from "node:assert/strict";
import test from "node:test";
import { formatEventDate, formatEventDayKey, formatEventTime } from "./format";

test("formats stored UTC moments in the event city timezone", () => {
  const value = "2026-09-18T15:30:00.000Z";
  assert.equal(formatEventTime(value, "Europe/Minsk"), "18:30");
  assert.match(formatEventDate(value, "Europe/Minsk"), /18 сентября/i);
});

test("uses the local city day when UTC crosses midnight", () => {
  assert.equal(formatEventDayKey("2026-09-18T22:30:00.000Z", "Europe/Minsk"), "2026-09-19");
});
