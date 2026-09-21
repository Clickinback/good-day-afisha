import assert from "node:assert/strict";
import test from "node:test";
import { normalizeImplicitEventYear } from "./date-normalization";
import type { ParsedEvent } from "./schema";

const base:ParsedEvent={isEvent:true,title:"Событие",description:null,city:"Полоцк",venue:null,address:null,startDate:"2023-09-30",startTime:null,timeTbd:true,endDate:null,endTime:null,category:"other",announcementStatus:"scheduled",priceMin:null,priceMax:null,isFree:null,ageRestriction:null,organizer:null,ticketUrl:null,confidence:.8,warnings:[],evidence:[]};
test("uses the nearest future year when source omits it",()=>{
  assert.equal(normalizeImplicitEventYear(base,"Открытие 30 сентября",new Date("2026-09-18T10:00:00Z")).startDate,"2026-09-30");
  assert.equal(normalizeImplicitEventYear({...base,startDate:"2023-01-05"},"Встречаемся 5 января",new Date("2026-12-20T10:00:00Z")).startDate,"2027-01-05");
});
test("preserves an explicitly written year",()=>assert.equal(normalizeImplicitEventYear(base,"Открытие 30 сентября 2023 года",new Date("2026-09-18T10:00:00Z")).startDate,"2023-09-30"));
