import test from 'node:test';
import assert from 'node:assert/strict';
import { createPreviewFetcher } from './preview-http';
import { isAllowedByRobots } from './robots';

test('preview validates redirect destinations, checks robots for every page, and caches robots per origin', async () => {
  const visited: string[] = [];
  const checked: string[] = [];
  const fetchPage = createPreviewFetcher({
    assertSafe: async input => { checked.push(input); if (input.includes('127.0.0.1')) throw new Error('private/local'); return new URL(input); },
    fetch: async input => {
      const url = String(input); visited.push(url);
      if (url.endsWith('/robots.txt')) return new Response('User-agent: *\nDisallow: /blocked/*');
      if (url.endsWith('/redirect')) return new Response(null, { status: 302, headers: { location: 'http://127.0.0.1/private' } });
      return new Response('<h1>ok</h1>', { headers: { 'content-type': 'text/html' } });
    },
  });
  await fetchPage('https://example.com/one');
  await fetchPage('https://example.com/two');
  await assert.rejects(fetchPage('https://example.com/blocked/1'), /robots/);
  await assert.rejects(fetchPage('https://example.com/redirect'), /private/);
  assert.equal(visited.filter(url => url.endsWith('/robots.txt')).length, 1);
  assert.equal(visited.some(url => url.includes('127.0.0.1') || url.includes('/blocked/')), false);
  assert.equal(checked.includes('http://127.0.0.1/private'), true);
});

test('preview fails closed for broken robots, oversized bodies and aborted requests', async () => {
  const assertSafe = async (url: string) => new URL(url);
  const broken = createPreviewFetcher({ assertSafe, fetch: async () => new Response('error', { status: 503 }) });
  await assert.rejects(broken('https://example.com'), /robots.txt.*503/);
  const large = createPreviewFetcher({ assertSafe, fetch: async input => String(input).endsWith('/robots.txt') ? new Response('', { status: 404 }) : new Response('x'.repeat(2_000_001), { headers: { 'content-type': 'text/html' } }) });
  await assert.rejects(large('https://example.com'), /слишком большой/);
  const aborted = createPreviewFetcher({ assertSafe, signal: AbortSignal.abort(), fetch: async () => { assert.fail('must not fetch'); } });
  await assert.rejects(aborted('https://example.com'), /abort/i);
});

test('robots wildcard paths, allows and specific agent rules are respected', () => {
  const target = (path: string) => new URL(path, 'https://ticketpro.by');
  const rules = 'User-agent: *\nDisallow: /kupit-bilet/*\nDisallow: /private/\nAllow: /private/public$';
  assert.equal(isAllowedByRobots(rules, target('/kupit-bilet/123')), false);
  assert.equal(isAllowedByRobots(rules, target('/bilety-v-teatr/event')), true);
  assert.equal(isAllowedByRobots(rules, target('/private/public')), true);
  assert.equal(isAllowedByRobots(rules, target('/private/public-more')), false);
  assert.equal(isAllowedByRobots('User-agent: *\nDisallow: /\nUser-agent: GoodDayAfishaBot\nAllow: /', target('/events')), true);
});
