import assert from "node:assert/strict";
import test from "node:test";
import { buildEventShareText, buildTelegramShareUrl, buildVkShareUrl } from "./event-sharing";

const text = buildEventShareText({
  title: "Вечер джаза",
  date: "Пт, 18 сентября",
  time: "18:30",
  venue: "Софийский собор",
  city: "Полоцк",
});

test("builds a readable event share message", () => {
  assert.match(text, /Вечер джаза/);
  assert.match(text, /18 сентября · 18:30/);
  assert.match(text, /Софийский собор, Полоцк/);
  assert.match(text, /Good Day Афиша/);
});

test("builds Telegram and VK share links", () => {
  const eventUrl = "https://afisha.good-day.by/polotsk/events/vecher-dzhaza";
  const telegram = new URL(buildTelegramShareUrl(eventUrl, text));
  const vk = new URL(buildVkShareUrl(eventUrl, text));

  assert.equal(telegram.hostname, "t.me");
  assert.equal(telegram.searchParams.get("url"), eventUrl);
  assert.equal(telegram.searchParams.get("text"), text);
  assert.equal(vk.hostname, "vk.com");
  assert.equal(vk.searchParams.get("url"), eventUrl);
  assert.equal(vk.searchParams.get("title"), text);
});
