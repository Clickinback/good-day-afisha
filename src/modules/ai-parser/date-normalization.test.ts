import assert from "node:assert/strict";
import test from "node:test";
import { normalizeImplicitEventYear } from "./date-normalization";
import type { ParsedEvent } from "./schema";
import { buildParserInput } from "./prompt";

const base:ParsedEvent={isEvent:true,title:"Событие",description:null,city:"Полоцк",venue:null,address:null,startDate:"2023-09-30",startTime:null,timeTbd:true,endDate:null,endTime:null,category:"other",announcementStatus:"scheduled",priceMin:null,priceMax:null,isFree:null,ageRestriction:null,organizer:null,ticketUrl:null,confidence:.8,warnings:[],evidence:[]};
test("missing publishedAt uses collection date for the September 24 regression",()=>{
  const rawText="24 сентября в Беларуси пройдёт Единый день безопасности. По всей стране будут организованы мероприятия.";
  const collectedAt=new Date("2026-09-22T10:00:00Z");
  const result=normalizeImplicitEventYear({...base,startDate:"2023-09-24",endDate:"2023-09-24"},rawText,null,collectedAt);
  assert.equal(result.startDate,"2026-09-24");
  assert.equal(result.endDate,"2026-09-24");
  const input=buildParserInput({rawText,sourceName:"NOVAYA.BY",sourceUrl:"https://t.me/novayaby/40931",publishedAt:null,collectedAt});
  assert.match(input[1].content,/PUBLISHED_AT: unknown/);
  assert.match(input[1].content,/DATE_ANCHOR: 2026-09-22T10:00:00.000Z/);
});
test("collection fallback preserves explicit historical dates",()=>{
  const result=normalizeImplicitEventYear({...base,startDate:"1996-10-15",endDate:"1996-10-16"},"15–16 октября 1996 года",null,new Date("2026-09-22T10:00:00Z"));
  assert.equal(result.startDate,"1996-10-15");
  assert.equal(result.endDate,"1996-10-16");
});
test("publication date takes precedence over a later collection date",()=>{
  assert.equal(normalizeImplicitEventYear({...base,startDate:"2023-09-24"},"24 сентября",new Date("2026-09-21T10:00:00Z"),new Date("2026-10-01T10:00:00Z")).startDate,"2026-09-24");
});
test("collection fallback handles a year boundary",()=>{
  assert.equal(normalizeImplicitEventYear({...base,startDate:"2023-01-05"},"5 января",null,new Date("2026-12-31T10:00:00Z")).startDate,"2027-01-05");
});
test("uses the nearest future year when source omits it",()=>{
  assert.equal(normalizeImplicitEventYear(base,"Открытие 30 сентября",new Date("2026-09-18T10:00:00Z")).startDate,"2026-09-30");
  assert.equal(normalizeImplicitEventYear({...base,startDate:"2023-01-05"},"Встречаемся 5 января",new Date("2026-12-20T10:00:00Z")).startDate,"2027-01-05");
});
test("preserves an explicitly written year",()=>assert.equal(normalizeImplicitEventYear(base,"Открытие 30 сентября 2023 года",new Date("2026-09-18T10:00:00Z")).startDate,"2023-09-30"));
