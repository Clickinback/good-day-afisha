// Shared with the form: no secrets, network requests or server-only imports here.
export type SourceSetup = {
  url: string;
  type: string;
  collectionMethod: string;
  config: Record<string, unknown>;
};

export type SourcePreset = SourceSetup & { label: string; hint: string };

export function sourcePreset(input: string): SourcePreset | null {
  let url: URL;
  try { url = new URL(input.trim()); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return null;
  const host = url.hostname.toLowerCase();
  if (host === 't.me' || host === 'telegram.me') {
    const match = url.pathname.match(/^\/(?:s\/)?([a-zA-Z][a-zA-Z0-9_]{3,31})(?:\/\d+)?\/?$/);
    if (!match || ['joinchat', 'share', 'proxy', 'socks', 'login', 'addstickers'].includes(match[1].toLowerCase())) return null;
    return {
      label: `Telegram — ${match[1]}`, hint: 'Публичные сообщения канала. Ссылка на отдельный пост будет заменена ссылкой на канал.',
      url: `https://t.me/s/${match[1]}`, type: 'TELEGRAM', collectionMethod: 'TELEGRAM',
      config: { maxItems: 20, includeForwarded: false, respectRobots: true },
    };
  }
  if (['www.ticketpro.by', 'ticketpro.by'].includes(host) && /^\/koncertnye-ploshhadki\/[a-z0-9-]+\/?$/.test(url.pathname)) {
    return {
      label: 'Ticketpro — афиша площадки', hint: 'События, даты и постеры со страницы площадки Ticketpro.',
      url: `https://www.ticketpro.by${url.pathname.replace(/\/?$/, '/')}`, type: 'WEBSITE', collectionMethod: 'HTML',
      config: {
        itemSelector: '.event-box', linkSelector: 'a.event-box__img', titleSelector: 'h1',
        descriptionSelector: '.content__left', dateSelector: '.content__event-date',
        imageSelector: '.sidebar-event__head img', maxItems: 20, delayMs: 800, respectRobots: true,
      },
    };
  }
  if (host === 'hubl.by' && /^\/novopolock\/afisha\/?$/.test(url.pathname)) {
    return {
      label: 'HUBL — афиша Новополоцка', hint: 'Структурированные события и расписание кино. Правила публикации остаются прежними.',
      url: 'https://hubl.by/novopolock/afisha', type: 'WEBSITE', collectionMethod: 'HTML',
      config: { maxItems: 20, respectRobots: true, syncScreenings: true },
    };
  }
  return null;
}

export function sourceFormValues(values: Record<string, unknown>) {
  const url = String(values.url ?? '').trim();
  if (values.setupMode !== 'automatic') return { ...values, url };
  const preset = sourcePreset(url);
  return {
    ...values, url: preset?.url ?? url,
    name: String(values.name ?? '').trim() || preset?.label || 'Новый источник',
    type: preset?.type ?? 'WEBSITE', collectionMethod: preset?.collectionMethod ?? 'HTML',
    config: JSON.stringify(preset?.config ?? {}),
  };
}

export function supportsSourceSetup(setup: Pick<SourceSetup, 'type' | 'collectionMethod'>) {
  return setup.type === 'WEBSITE' && setup.collectionMethod === 'HTML'
    || setup.type === 'TELEGRAM' && setup.collectionMethod === 'TELEGRAM';
}
