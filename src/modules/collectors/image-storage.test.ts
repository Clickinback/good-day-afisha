import assert from "node:assert/strict";
import test from "node:test";
import { extensionForContentType,isPersistableImageUrl,storedImageFilename } from "./image-storage";

test("allows approved event image hosts over HTTPS",()=>{assert.equal(isPersistableImageUrl("https://cdn4.telesco.pe/file/a.jpg"),true);assert.equal(isPersistableImageUrl("https://hubl.by/storage/posters/a.webp"),true);assert.equal(isPersistableImageUrl("https://hubl.by/news/a.webp"),false);assert.equal(isPersistableImageUrl("http://cdn4.telesco.pe/file/a.jpg"),false);assert.equal(isPersistableImageUrl("https://example.com/a.jpg"),false)});
test("allows TMDB image paths supplied by HUBL",()=>{
  assert.equal(isPersistableImageUrl("https://image.tmdb.org/t/p/w780/gwCwmTk2EfDccd4RtIPsWEwzd1r.jpg"),true);
  assert.equal(isPersistableImageUrl("https://image.tmdb.org/t/p/w780/wgYZL3ltYDn5Bhi7XFjTOpfQIln.jpg"),true);
  assert.equal(isPersistableImageUrl("https://image.tmdb.org/t/p/original/poster.png"),true);
});
test("does not extend TMDB permission to other hosts, ports, paths or credentials",()=>{
  for(const url of [
    "http://image.tmdb.org/t/p/w780/poster.jpg",
    "https://image.tmdb.org.example.com/t/p/w780/poster.jpg",
    "https://www.themoviedb.org/t/p/w780/poster.jpg",
    "https://image.tmdb.org:8443/t/p/w780/poster.jpg",
    "https://user:password@image.tmdb.org/t/p/w780/poster.jpg",
    "https://image.tmdb.org/other/poster.jpg",
    "https://image.tmdb.org/t/p/w780/../../other/poster.jpg",
    "https://image.tmdb.org/t/p/w780/poster.svg",
  ])assert.equal(isPersistableImageUrl(url),false,url);
});
test("maps supported image MIME types",()=>{assert.equal(extensionForContentType("image/jpeg; charset=binary"),"jpg");assert.equal(extensionForContentType("text/html"),null)});
test("accepts only content-addressed media filenames",()=>{const hash="a".repeat(64);assert.equal(storedImageFilename(`/media/events/poster-${hash}.webp`),`poster-${hash}.webp`);assert.equal(storedImageFilename("/media/events/../../.env.production"),null)});
