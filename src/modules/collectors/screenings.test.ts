import assert from "node:assert/strict";
import test from "node:test";
import { parseScreenings } from "./screenings";

test("extracts cinema showtimes and ticket data",()=>{const html=`<script type="application/ld+json">{"@type":"ScreeningEvent","name":"Фильм","startDate":"2026-08-29T10:30:00+03:00","offers":{"price":"12.00","url":"https://tickets.example/1"}}</script>`;const [item]=parseScreenings(html,"https://example.by/movie");assert.equal(item.startsAt.toISOString(),"2026-08-29T07:30:00.000Z");assert.equal(item.price,12);assert.equal(item.ticketUrl,"https://tickets.example/1")});
