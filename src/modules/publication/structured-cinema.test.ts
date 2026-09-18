import assert from "node:assert/strict";
import test from "node:test";
import { isTrustedStructuredCinema } from "./structured-cinema";

const link={sourceId:"src_cinemaminsk_np",sourceUrl:"https://hubl.by/novopolock/kino/film",source:{url:"https://hubl.by/novopolock/afisha",active:true,config:{syncScreenings:true}}};

test("recognizes only the configured structured cinema source",()=>{
  assert.equal(isTrustedStructuredCinema([link]),true);
  assert.equal(isTrustedStructuredCinema([{...link,source:{...link.source,url:"https://hubl.by/novopolock/afisha/"}}]),true);
  assert.equal(isTrustedStructuredCinema([{...link,sourceId:"telegram"}]),false);
  assert.equal(isTrustedStructuredCinema([{...link,sourceUrl:"https://evil.example/film"}]),false);
  assert.equal(isTrustedStructuredCinema([{...link,sourceUrl:"https://hubl.by/novopolock/afisha"}]),false);
  assert.equal(isTrustedStructuredCinema([{...link,source:{...link.source,active:false}}]),false);
  assert.equal(isTrustedStructuredCinema([{...link,source:{...link.source,config:{}}}]),false);
});
