import assert from "node:assert/strict";
import test from "node:test";
import { isTrustedStructuredCinema } from "./structured-cinema";

const link={sourceId:"src_cinemaminsk_np",source:{url:"https://hubl.by/novopolock/afisha",active:true,config:{syncScreenings:true}},rawEvent:{url:"https://hubl.by/novopolock/kino/film",rawHtml:JSON.stringify({"@type":"Event",name:"Фильм",startDate:"2026-09-19T11:00:00+03:00"})}};

test("recognizes only the configured structured cinema source",()=>{
  assert.equal(isTrustedStructuredCinema([link]),true);
  assert.equal(isTrustedStructuredCinema([{...link,source:{...link.source,url:"https://hubl.by/novopolock/afisha/"}}]),true);
  assert.equal(isTrustedStructuredCinema([{...link,sourceId:"telegram"}]),false);
  assert.equal(isTrustedStructuredCinema([{...link,rawEvent:{...link.rawEvent,url:"https://evil.example/film"}}]),false);
  assert.equal(isTrustedStructuredCinema([{...link,rawEvent:{...link.rawEvent,rawHtml:JSON.stringify({"@type":"Event",name:"Фильм",startDate:"tomorrow"})}}]),false);
});
