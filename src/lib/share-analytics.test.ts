import assert from "node:assert/strict";
import test from "node:test";
import { hasSameHostOrigin, shareMetricDay } from "./share-analytics";

test("normalizes share metrics to the Minsk calendar day", () => {
  assert.equal(shareMetricDay(new Date("2026-09-10T20:59:59.000Z")).toISOString(), "2026-09-10T00:00:00.000Z");
  assert.equal(shareMetricDay(new Date("2026-09-10T21:00:00.000Z")).toISOString(), "2026-09-11T00:00:00.000Z");
});

test("accepts only requests from the same public host", () => {
  const sameHost = new Request("http://afisha-app:3000/api", { headers: { origin: "https://afisha.good-day.by", host: "afisha-app:3000", "x-forwarded-host": "afisha.good-day.by" } });
  const foreignHost = new Request("https://afisha.good-day.by/api", { headers: { origin: "https://example.com", host: "afisha.good-day.by" } });
  assert.equal(hasSameHostOrigin(sameHost), true);
  assert.equal(hasSameHostOrigin(foreignHost), false);
});
