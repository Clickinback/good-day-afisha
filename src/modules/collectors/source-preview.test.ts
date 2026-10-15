import test from 'node:test';
import assert from 'node:assert/strict';
import { previewSourceItems } from './source-preview';
import { sourcePreset } from './source-presets';

test('Ticketpro preview reads three description pages and returns text + allowed posters without persistence', async () => {
  const setup = sourcePreset('https://www.ticketpro.by/koncertnye-ploshhadki/dom-kultury-naftan/')!;
  const visited: string[] = [];
  const result = await previewSourceItems(setup, async url => {
    visited.push(url);
    return { url, contentType: 'text/html', html: url === setup.url
      ? `<script type="application/ld+json">{malformed}</script>${Array.from({ length: 4 }, (_, i) => `<div class="event-box"><a class="event-box__img" href="/bilety-v-teatr/event-${i}/">Карточка</a><a href="/kupit-bilet/${i}/">Купить</a></div>`).join('')}`
      : '<h1>Спектакль</h1><div class="content__left">20 октября 2026, 19:00. ДК Нафтан</div><div class="content__event-date">20.10.2026</div><div class="sidebar-event__head"><img src="/storage/img/uploads/event/poster.png"></div>' };
  });
  assert.equal(visited.length, 4);
  assert.equal(result.length, 3);
  assert.equal(visited.some(url => url.includes('/kupit-bilet/')), false);
  assert.match(result[0].text, /ДК Нафтан/);
  assert.equal(result[0].imageUrl, 'https://www.ticketpro.by/storage/img/uploads/event/poster.png');
  assert.equal(setup.config.maxItems, 20, 'preview must not mutate saved settings');
});

test('Telegram preview contains messages, not AI-generated events; unknown images are labelled', async () => {
  const setup = sourcePreset('https://t.me/novayaby')!;
  const items = await previewSourceItems(setup, async url => ({ url, contentType: 'text/html', html: '<div class="tgme_widget_message_wrap"><div class="tgme_widget_message" data-post="novayaby/1"><div class="tgme_widget_message_text">Концерт 24 сентября</div><a class="tgme_widget_message_photo_wrap" style="background-image:url(https://unknown.test/a.jpg)"></a></div></div>' }));
  assert.equal(items[0].title, 'Концерт 24 сентября');
  assert.equal(items[0].url, 'https://t.me/novayaby/1');
  assert.equal(items[0].imageUrl, undefined);
  assert.match(items[0].imageWarning!, /не поддерживается/);
});

test('unsupported collection method fails before any request', async () => {
  await assert.rejects(previewSourceItems({ url: 'https://example.com', type: 'API', collectionMethod: 'API', config: {} }, async () => { assert.fail('must not fetch'); }), /не поддерживается/);
});

test('does not expose unsafe JSON-LD links or images', async () => {
  const setup = sourcePreset('https://hubl.by/novopolock/afisha')!;
  const items = await previewSourceItems(setup, async url => ({ url, contentType: 'text/html', html: '<script type="application/ld+json">{"@type":"Event","name":"bad","url":"javascript:alert(1)","image":"http://127.0.0.1/private.png"}</script>' }));
  assert.deepEqual(items, []);
});
