import assert from "node:assert/strict";
import test from "node:test";
import { extractCinemaPoster } from "./cinema-poster";

const url = "https://hubl.by/novopolock/kino/movie";
test("selects the film's portrait poster instead of its banner or another film", () => {
  const html = '<h1>Фильм</h1><img alt="Фильм" src="/storage/banner.webp" width="1200" height="630"><img alt="Другой" src="/storage/other.webp" width="400" height="600"><img alt="Фильм" src="/storage/poster.webp" width="400" height="600">';
  assert.equal(extractCinemaPoster(html, url), "https://hubl.by/storage/poster.webp");
});
test("rejects landscape banners and unsafe hosts", () => {
  assert.equal(extractCinemaPoster('<h1>Фильм</h1><img class="poster" alt="Фильм" src="/storage/banner.webp" width="1200" height="630">', url), undefined);
  assert.equal(extractCinemaPoster('<h1>Фильм</h1><img alt="Фильм" src="https://other.example/poster.jpg" width="400" height="600">', url), undefined);
});
