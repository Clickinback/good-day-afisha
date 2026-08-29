import assert from "node:assert/strict";
import test from "node:test";
import { scoreEvents,textSimilarity } from "./similarity";
test("normalizes word order and event boilerplate",()=>assert.ok(textSimilarity("Концерт группы N","Группа N — концерт")>.75));
test("scores the same event highly",()=>{const score=scoreEvents({title:"Концерт группы N",startsAt:new Date("2026-09-01T16:00:00Z"),city:"Полоцк",venue:"Софийский собор"},{title:"Группа N — концерт",startsAt:new Date("2026-09-01T16:15:00Z"),city:"Полоцк",venue:"Софийский собор"});assert.ok(score.total>.85)});
test("penalizes a different date and city",()=>{const score=scoreEvents({title:"Фестиваль света",startsAt:new Date("2026-09-01T16:00:00Z"),city:"Полоцк"},{title:"Фестиваль света",startsAt:new Date("2026-09-04T16:00:00Z"),city:"Новополоцк"});assert.ok(score.total<.7)});
test("returns explainable components",()=>{const score=scoreEvents({title:"Театр",startsAt:new Date("2026-09-01T16:00:00Z"),city:"Полоцк"},{title:"Театр",startsAt:new Date("2026-09-01T16:00:00Z"),city:"Полоцк"});assert.equal(score.title,1);assert.equal(score.city,1);assert.equal(score.venue,null)});
