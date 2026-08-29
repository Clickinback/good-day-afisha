import assert from "node:assert/strict";import test from "node:test";import { collectionRuleSchema,selectCandidates } from "./rules";
const rows=[{id:"1",startsAt:new Date("2026-08-28T18:00:00"),categorySlug:"concerts",isFree:false,ageRestriction:"12+"},{id:"2",startsAt:new Date("2026-08-28T12:00:00"),categorySlug:"kids",isFree:true,ageRestriction:"0+"}];
test("validates bounded collection rules",()=>assert.equal(collectionRuleSchema.parse({period:"week",limit:7}).limit,7));
test("selects kids and respects exclusions",()=>assert.deepEqual(selectCandidates(rows,{period:"week",kids:true,limit:7},new Set(["1"])).map(x=>x.id),["2"]));
test("selects evening events",()=>assert.deepEqual(selectCandidates(rows,{period:"today",evening:true,limit:7}).map(x=>x.id),["1"]));
