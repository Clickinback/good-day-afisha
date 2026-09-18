import assert from "node:assert/strict";
import test from "node:test";
import { extractCinemaDetails } from "./cinema-details";

const url = "https://hubl.by/novopolock/kino/hitryy-koyot";

test("extracts verified film details and a portrait poster", () => {
  const html = `<h1>Хитрый койот</h1>
    <div>Кино 12+ Кинотеатр "Минск" (Новополоцк)</div>
    <script type="application/ld+json">${JSON.stringify({"@type":"Movie",name:"Хитрый койот",description:"После очередной неудачной попытки поймать Дорожного Бегуна Хитрый Койот решает разобраться с компанией АКМЕ."})}</script>
    <img alt="Хитрый койот" src="/storage/banner.webp" width="1200" height="600">
    <img alt="Хитрый койот" src="/storage/poster.webp" width="400" height="600">
    <div>211449, г.Новополоцк, ул.Молодёжная, 152</div>`;
  assert.deepEqual(extractCinemaDetails(html,url),{
    description:"После очередной неудачной попытки поймать Дорожного Бегуна Хитрый Койот решает разобраться с компанией АКМЕ.",
    venueName:"Кинотеатр «Минск»",address:"г. Новополоцк, ул. Молодёжная, 152",ageRestriction:"12+",imageUrl:"https://hubl.by/storage/poster.webp",
  });
});

test("uses the film's real image and description when the page has no sized portrait", () => {
  const html = `<meta property="og:image" content="/storage/generic-logo.webp"><h1>Хитрый койот</h1>
    <img alt="Хитрый койот" src="/storage/hitryy-koyot.webp">
    <section><h2>Описание</h2><p>Хитрый Койот решает доказать, что товары компании АКМЕ постоянно оборачиваются против него и причиняют ему вред.</p></section>`;
  const details=extractCinemaDetails(html,url);
  assert.equal(details.description,"Хитрый Койот решает доказать, что товары компании АКМЕ постоянно оборачиваются против него и причиняют ему вред.");
  assert.equal(details.imageUrl,"https://hubl.by/storage/hitryy-koyot.webp");
  assert.equal(details.venueName,undefined);
});

test("reads visible HUBL synopsis when structured data and paragraph selectors are absent", () => {
  const html=`<h1>Миа и монстры</h1><nav>Описание Расписание</nav><div>Описание</div><div>Миа мечтает доказать жителям своего города, что монстры существуют на самом деле и совсем не опасны.</div><button>Читать ещё</button><h2>Сеансы в городе Новополоцк</h2>`;
  assert.equal(extractCinemaDetails(html,"https://hubl.by/novopolock/kino/mia-i-monstry-2").description,"Миа мечтает доказать жителям своего города, что монстры существуют на самом деле и совсем не опасны.");
});

test("never extracts cinema data from unrelated hosts or other films", () => {
  const html=`<h1>Хитрый койот</h1><script type="application/ld+json">${JSON.stringify({"@type":"Movie",name:"Другой фильм",description:"Описание чужого фильма, которое ни в коем случае не должно попасть в нашу карточку."})}</script>`;
  assert.equal(extractCinemaDetails(html,url).description,undefined);
  assert.deepEqual(extractCinemaDetails(html,"https://other.example/film"),{});
});

test("does not mistake a generic page image for the film poster", () => {
  const html='<meta property="og:image" content="/storage/generic-logo.webp"><h1>Хитрый койот</h1>';
  assert.equal(extractCinemaDetails(html,url).imageUrl,undefined);
});
