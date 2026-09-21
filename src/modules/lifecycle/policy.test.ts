import assert from "node:assert/strict";import test from "node:test";import { canApplyLifecycleUpdate,expirationBoundary,hasSuspiciousPastYear,isExpired } from "./policy";
test("finishes an event after its end",()=>assert.equal(isExpired({startsAt:new Date("2026-08-28T10:00:00Z"),endsAt:new Date("2026-08-28T12:00:00Z")},new Date("2026-08-28T12:01:00Z")),true));
test("keeps an event during grace",()=>assert.equal(isExpired({startsAt:new Date("2026-08-28T10:00:00Z"),endsAt:null},new Date("2026-08-28T15:00:00Z")),false));
test("keeps a time-TBD event until the end of its local day",()=>{
  const event={startsAt:new Date("2026-09-02T21:00:00Z"),endsAt:null,timeTbd:true,timezone:"Europe/Minsk"};
  assert.equal(expirationBoundary(event).toISOString(),"2026-09-03T20:59:59.999Z");
  assert.equal(isExpired(event,new Date("2026-09-03T03:00:00Z")),false);
  assert.equal(isExpired(event,new Date("2026-09-03T21:00:00Z")),true);
});
test("flags a previous local year for review",()=>{
  assert.equal(hasSuspiciousPastYear({startsAt:new Date("2023-09-30T18:00:00Z"),timezone:"Europe/Minsk"},new Date("2026-09-21T17:00:00Z")),true);
  assert.equal(hasSuspiciousPastYear({startsAt:new Date("2026-09-01T18:00:00Z"),timezone:"Europe/Minsk"},new Date("2026-09-21T17:00:00Z")),false);
});
test("trust or corroboration applies updates",()=>{assert.equal(canApplyLifecycleUpdate(.8,1),true);assert.equal(canApplyLifecycleUpdate(.4,2),true);assert.equal(canApplyLifecycleUpdate(.4,1),false)});
