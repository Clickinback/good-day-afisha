import test from 'node:test';
import assert from 'node:assert/strict';
import { sourceFormValues, sourcePreset } from './source-presets';
import { sourceFormSchema } from '@/modules/admin/schemas';

test('Telegram channel, preview and post URLs become a public channel URL', () => {
  for (const url of ['https://t.me/novayaby', 'https://t.me/s/novayaby', 'https://telegram.me/novayaby/40931?single']) {
    const preset = sourcePreset(url)!;
    assert.equal(preset.url, 'https://t.me/s/novayaby');
    assert.equal(preset.type, 'TELEGRAM');
    assert.equal(preset.collectionMethod, 'TELEGRAM');
  }
});

test('only supported host/path combinations get a preset', () => {
  for (const url of ['https://t.me/+invite', 'https://t.me/c/123/1', 'https://t.me/share/url', 'https://t.me/login', 'https://t.me.evil.test/channel', 'https://user:pass@t.me/channel', 'https://t.me:8443/channel', 'https://www.ticketpro.by/kupit-bilet/1/', 'https://hubl.by/news', 'https://example.com']) assert.equal(sourcePreset(url), null, url);
  assert.equal(sourcePreset('https://hubl.by/novopolock/afisha')?.config.syncScreenings, true);
});

test('Ticketpro preset follows event cards, not purchase URLs; save does not trust client config', () => {
  const values = sourceFormValues({ setupMode: 'automatic', url: 'https://ticketpro.by/koncertnye-ploshhadki/dom-kultury-naftan', name: '', config: '{"respectRobots":false}', type: 'API', trustScore: '0.5' });
  const parsed = sourceFormSchema.parse(values);
  assert.equal(parsed.url, 'https://www.ticketpro.by/koncertnye-ploshhadki/dom-kultury-naftan/');
  assert.equal(parsed.type, 'WEBSITE');
  assert.equal(parsed.config.linkSelector, 'a.event-box__img');
  assert.equal(parsed.config.respectRobots, true);
  assert.equal(parsed.active, false);
  assert.equal(parsed.name, 'Ticketpro — афиша площадки');
});

test('editing preserves custom config and unknown fields', () => {
  const values = { setupMode: 'manual', name: 'Мой канал', url: 'https://t.me/s/channel', type: 'TELEGRAM', collectionMethod: 'TELEGRAM', trustScore: '0.876', config: '{"includeForwarded":true,"maxItems":7,"customOption":"keep"}' };
  const parsed = sourceFormSchema.parse(sourceFormValues(values));
  assert.deepEqual(parsed.config, { includeForwarded: true, maxItems: 7, customOption: 'keep' });
  assert.equal(parsed.trustScore, 0.876);
});

test('rejects malformed configs, invalid limits and non-HTTP URLs without throwing', () => {
  const values = { name: 'Test', url: 'https://example.com', type: 'WEBSITE', collectionMethod: 'HTML', trustScore: '.5' };
  for (const config of ['null', '[]', '"str"', '{bad}', '{"maxItems":-1}', '{"maxItems":"100"}', '{"delayMs":999999}']) assert.equal(sourceFormSchema.safeParse({ ...values, config }).success, false, config);
  for (const url of ['bad', 'file:///etc/passwd', 'https://user:pass@example.com']) assert.equal(sourceFormSchema.safeParse({ ...values, url }).success, false, url);
});
