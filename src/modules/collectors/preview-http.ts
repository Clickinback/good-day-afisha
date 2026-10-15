import { assertSafeUrl } from './http';
import { isAllowedByRobots } from './robots';
import type { FetchPageResult } from './types';

const maxBytes = 2_000_000;

// Separate, bounded reader: previews never create CollectorRun, RawEvent or media files.
export function createPreviewFetcher(deps: {
  fetch?: typeof fetch;
  assertSafe?: typeof assertSafeUrl;
  signal?: AbortSignal;
} = {}) {
  const request = deps.fetch ?? fetch;
  const assertSafe = deps.assertSafe ?? assertSafeUrl;
  const deadline = deps.signal ?? AbortSignal.timeout(35_000);
  const robots = new Map<string, string>();
  let requests = 0;

  async function readBody(response: Response) {
    if (Number(response.headers.get('content-length') ?? 0) > maxBytes) {
      await response.body?.cancel();
      throw new Error('Ответ сайта слишком большой для проверки');
    }
    const reader = response.body?.getReader();
    if (!reader) return '';
    const decoder = new TextDecoder();
    let bytes = 0;
    let text = '';
    try {
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        bytes += chunk.value.byteLength;
        if (bytes > maxBytes) throw new Error('Ответ сайта слишком большой для проверки');
        text += decoder.decode(chunk.value, { stream: true });
      }
      return text + decoder.decode();
    } finally { await reader.cancel(); }
  }

  async function read(input: string, isRobots = false, redirects = 0): Promise<FetchPageResult> {
    deadline.throwIfAborted();
    const url = await assertSafe(input);
    if (++requests > 14) throw new Error('Слишком много запросов для быстрой проверки');
    if (!isRobots) {
      if (!robots.has(url.origin)) {
        const result = await read(new URL('/robots.txt', url).href, true);
        robots.set(url.origin, result.html);
      }
      if (!isAllowedByRobots(robots.get(url.origin)!, url)) throw new Error('Сбор запрещён robots.txt');
    }
    const response = await request(url, {
      redirect: 'manual', cache: 'no-store',
      signal: AbortSignal.any([deadline, AbortSignal.timeout(8_000)]),
      headers: { 'user-agent': 'GoodDayAfishaBot/0.1', accept: 'text/html,text/plain,application/xhtml+xml' },
    });
    if (response.status >= 300 && response.status < 400) {
      await response.body?.cancel();
      const location = response.headers.get('location');
      if (!location || redirects >= 3) throw new Error('Не удалось пройти перенаправления сайта');
      return read(new URL(location, url).href, isRobots, redirects + 1);
    }
    if (isRobots && response.status === 404) {
      await response.body?.cancel();
      return { url: url.href, html: '', contentType: 'text/plain' };
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`${isRobots ? 'robots.txt: ' : ''}сайт вернул HTTP ${response.status}`);
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (!isRobots && !/text\/html|application\/xhtml\+xml/i.test(contentType)) {
      await response.body?.cancel();
      throw new Error('По ссылке нет HTML-страницы с событиями');
    }
    return { url: url.href, html: await readBody(response), contentType };
  }
  return (url: string) => read(url);
}
