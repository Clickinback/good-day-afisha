import assert from "node:assert/strict";
import test from "node:test";
import { estimateOpenAiCost, openAiPricingFromEnv, openAiUsageWindows } from "./openai-usage";

test("builds Minsk calendar windows", () => {
  const windows = openAiUsageWindows(new Date("2026-09-11T22:30:00Z"));
  assert.equal(windows.today.toISOString(), "2026-09-11T21:00:00.000Z");
  assert.equal(windows.sevenDays.toISOString(), "2026-09-05T21:00:00.000Z");
  assert.equal(windows.thirtyDays.toISOString(), "2026-08-13T21:00:00.000Z");
});

test("calculates cost from configurable model pricing", () => {
  assert.equal(estimateOpenAiCost(
    { input: 2_000_000, output: 500_000 },
    { inputPerMillionUsd: 0.25, outputPerMillionUsd: 2 },
  ), 1.5);
  assert.equal(estimateOpenAiCost({ input: 100, output: 50 }, null), null);
});

test("requires both pricing values", () => {
  assert.deepEqual(openAiPricingFromEnv({
    OPENAI_INPUT_PRICE_USD_PER_1M_TOKENS: "0.25",
    OPENAI_OUTPUT_PRICE_USD_PER_1M_TOKENS: "2",
  }), { inputPerMillionUsd: 0.25, outputPerMillionUsd: 2 });
  assert.equal(openAiPricingFromEnv({ OPENAI_INPUT_PRICE_USD_PER_1M_TOKENS: "0.25" }), null);
});
