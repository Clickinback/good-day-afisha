import { startOfDay, subDays } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const USAGE_TIMEZONE = "Europe/Minsk";

export type TokenUsage = {
  input: number;
  output: number;
};

export type TokenPricing = {
  inputPerMillionUsd: number;
  outputPerMillionUsd: number;
};

type PricingEnvironment = {
  OPENAI_INPUT_PRICE_USD_PER_1M_TOKENS?: string;
  OPENAI_OUTPUT_PRICE_USD_PER_1M_TOKENS?: string;
};

export function openAiUsageWindows(now = new Date()) {
  const localToday = startOfDay(toZonedTime(now, USAGE_TIMEZONE));
  return {
    today: fromZonedTime(localToday, USAGE_TIMEZONE),
    sevenDays: fromZonedTime(subDays(localToday, 6), USAGE_TIMEZONE),
    thirtyDays: fromZonedTime(subDays(localToday, 29), USAGE_TIMEZONE),
  };
}

export function estimateOpenAiCost(usage: TokenUsage, pricing: TokenPricing | null) {
  if (!pricing) return null;
  return usage.input / 1_000_000 * pricing.inputPerMillionUsd
    + usage.output / 1_000_000 * pricing.outputPerMillionUsd;
}

export function openAiPricingFromEnv(env: PricingEnvironment = process.env as PricingEnvironment): TokenPricing | null {
  const inputValue = env.OPENAI_INPUT_PRICE_USD_PER_1M_TOKENS?.trim();
  const outputValue = env.OPENAI_OUTPUT_PRICE_USD_PER_1M_TOKENS?.trim();
  if (!inputValue || !outputValue) return null;
  const inputPerMillionUsd = Number(inputValue);
  const outputPerMillionUsd = Number(outputValue);
  if (!Number.isFinite(inputPerMillionUsd) || inputPerMillionUsd < 0) return null;
  if (!Number.isFinite(outputPerMillionUsd) || outputPerMillionUsd < 0) return null;
  return { inputPerMillionUsd, outputPerMillionUsd };
}

export function formatTokenCount(value: number) {
  return new Intl.NumberFormat("ru-BY").format(value);
}

export function formatEstimatedUsd(value: number | null) {
  if (value === null) return "тариф не задан";
  if (value > 0 && value < 0.0001) return "< $0.0001";
  return `≈ $${value.toFixed(value < 1 ? 4 : 2)}`;
}
