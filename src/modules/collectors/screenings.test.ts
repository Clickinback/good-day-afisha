import assert from "node:assert/strict";
import test from "node:test";
import { parseScreenings, screeningFromListing, shouldReactivateScreeningEvent } from "./screenings";

test("extracts cinema showtimes and ticket data",()=>{const html=`<script type="application/ld+json">{"@type":"ScreeningEvent","name":"Фильм","startDate":"2026-08-29T10:30:00+03:00","offers":{"price":"12.00","url":"https://tickets.example/1"}}</script>`;const [item]=parseScreenings(html,"https://example.by/movie");assert.equal(item.startsAt.toISOString(),"2026-08-29T07:30:00.000Z");assert.equal(item.price,12);assert.equal(item.ticketUrl,"https://tickets.example/1")});

test("uses an exact showtime from the listing when a film page lacks ScreeningEvent",()=>{
  const item={url:"https://hubl.by/novopolock/kino/film",rawText:"Фильм",rawHtml:JSON.stringify({"@type":"Event",name:"Фильм",startDate:"2026-09-19T11:00:00+03:00",offers:{price:"9",url:"https://tickets.example/film"}})};
  const screening=screeningFromListing(item);
  assert.equal(screening?.startsAt.toISOString(),"2026-09-19T08:00:00.000Z");
  assert.equal(screening?.price,9);
  assert.equal(screening?.ticketUrl,"https://tickets.example/film");
});

test("does not invent midnight showtimes from date-only listing data",()=>{
  assert.equal(screeningFromListing({url:"https://hubl.by/novopolock/kino/film",rawText:"Фильм",rawHtml:JSON.stringify({"@type":"Event",startDate:"2026-09-19"})}),null);
});

test("reactivates a finished film when new screenings appear",()=>{
  assert.equal(shouldReactivateScreeningEvent("FINISHED",true),true);
  assert.equal(shouldReactivateScreeningEvent("CANCELLED",true),false);
  assert.equal(shouldReactivateScreeningEvent("FINISHED",false),false);
});
