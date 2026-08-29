import assert from "node:assert/strict";
import test from "node:test";
import { moderationInsights } from "./insights";

test("explains incomplete low-confidence events", () => {
  const result = moderationInsights({
    description:null,shortDescription:null,imageUrl:null,venueId:null,address:null,
    priceMin:null,isFree:false,ageRestriction:null,ticketUrl:null,organizerId:null,
    endsAt:null,confidence:0.72,publishConfidence:0.68,
  });
  assert.ok(result.missing.includes("изображение"));
  assert.ok(result.missing.includes("стоимость"));
  assert.ok(result.reasons.includes("publish confidence ниже 90%"));
});

test("does not require a price for free events", () => {
  const result = moderationInsights({
    description:"Описание",shortDescription:null,imageUrl:"/image.jpg",venueId:"venue",address:null,
    priceMin:null,isFree:true,ageRestriction:"0+",ticketUrl:"https://example.com",organizerId:"organizer",
    endsAt:new Date(),confidence:0.95,publishConfidence:0.93,
  });
  assert.equal(result.missing.includes("стоимость"),false);
  assert.equal(result.reasons.length,0);
});

