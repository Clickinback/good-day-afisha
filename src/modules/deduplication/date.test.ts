import assert from "node:assert/strict";
import test from "node:test";
import { localEventDate } from "./date";

test("accepts a real date in the city timezone",()=>{
  assert.equal(localEventDate("2026-09-18","18:30","Europe/Minsk")?.toISOString(),"2026-09-18T15:30:00.000Z");
});

test("rejects malformed or impossible dates before Prisma sees Invalid Date",()=>{
  for(const value of ["tomorrow","2026-02-30","2026-13-01","2026-09-18T18:30:00"]){
    assert.equal(localEventDate(value,"18:30","Europe/Minsk"),null);
  }
  assert.equal(localEventDate("2026-09-18","25:00","Europe/Minsk"),null);
});
