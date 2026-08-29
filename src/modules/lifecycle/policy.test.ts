import assert from "node:assert/strict";import test from "node:test";import { canApplyLifecycleUpdate,isExpired } from "./policy";
test("finishes an event after its end",()=>assert.equal(isExpired({startsAt:new Date("2026-08-28T10:00:00Z"),endsAt:new Date("2026-08-28T12:00:00Z")},new Date("2026-08-28T12:01:00Z")),true));
test("keeps an event during grace",()=>assert.equal(isExpired({startsAt:new Date("2026-08-28T10:00:00Z"),endsAt:null},new Date("2026-08-28T15:00:00Z")),false));
test("trust or corroboration applies updates",()=>{assert.equal(canApplyLifecycleUpdate(.8,1),true);assert.equal(canApplyLifecycleUpdate(.4,2),true);assert.equal(canApplyLifecycleUpdate(.4,1),false)});
