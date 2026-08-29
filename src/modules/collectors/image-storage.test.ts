import assert from "node:assert/strict";
import test from "node:test";
import { extensionForContentType,isPersistableImageUrl } from "./image-storage";

test("allows approved event image hosts over HTTPS",()=>{assert.equal(isPersistableImageUrl("https://cdn4.telesco.pe/file/a.jpg"),true);assert.equal(isPersistableImageUrl("https://hubl.by/storage/posters/a.webp"),true);assert.equal(isPersistableImageUrl("https://hubl.by/news/a.webp"),false);assert.equal(isPersistableImageUrl("http://cdn4.telesco.pe/file/a.jpg"),false);assert.equal(isPersistableImageUrl("https://example.com/a.jpg"),false)});
test("maps supported image MIME types",()=>{assert.equal(extensionForContentType("image/jpeg; charset=binary"),"jpg");assert.equal(extensionForContentType("text/html"),null)});
