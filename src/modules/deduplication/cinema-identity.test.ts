import assert from "node:assert/strict";
import test from "node:test";
import { isHublCinemaVariant } from "./cinema-identity";

test("flags HUBL film URL variants for manual review despite different showtime dates",()=>{
  assert.equal(isHublCinemaVariant(
    {title:"Край чудес",url:"https://hubl.by/novopolock/kino/kray-chudes"},
    {title:"Край чудес",url:"https://hubl.by/novopolock/kino/kray-chudes-3"},
  ),true);
});

test("does not conflate cities, film titles, or unrelated sites",()=>{
  const incoming={title:"Край чудес",url:"https://hubl.by/novopolock/kino/kray-chudes"};
  assert.equal(isHublCinemaVariant(incoming,{title:"Край чудес",url:"https://hubl.by/minsk/kino/kray-chudes-3"}),false);
  assert.equal(isHublCinemaVariant(incoming,{title:"Край чудес 2",url:"https://hubl.by/novopolock/kino/kray-chudes-2"}),false);
  assert.equal(isHublCinemaVariant(incoming,{title:"Край чудес",url:"https://example.com/novopolock/kino/kray-chudes-3"}),false);
});
