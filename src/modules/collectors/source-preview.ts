import { Prisma, type Source } from '@prisma/client';
import { collectorFor } from './registry';
import { createPreviewFetcher } from './preview-http';
import { isPersistableImageUrl } from './image-storage';
import { supportsSourceSetup, type SourceSetup } from './source-presets';
import type { FetchPageResult } from './types';

export type SourcePreviewItem = { url: string; title: string; text: string; imageUrl?: string; imageWarning?: string };
export type SourcePreviewState = { ok: boolean; message: string; items?: SourcePreviewItem[]; token?: string };

function safePublicLink(input: string) {
  try { const url = new URL(input); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}

export async function previewSourceItems(setup: SourceSetup, fetchPage: (url: string) => Promise<FetchPageResult> = createPreviewFetcher()): Promise<SourcePreviewItem[]> {
  if (!supportsSourceSetup(setup)) throw new Error('Этот метод сбора ещё не поддерживается. Требуется настройка подключения.');
  const maxItems = Math.min(typeof setup.config.maxItems === 'number' ? setup.config.maxItems : 3, 3);
  const source: Source = {
    id: 'preview-only', name: 'Проверка источника', url: setup.url, type: setup.type as Source['type'],
    collectionMethod: setup.collectionMethod as Source['collectionMethod'],
    config: { ...setup.config, maxItems, delayMs: 0 } as Prisma.JsonObject,
    cityId: null, active: false, trustScore: new Prisma.Decimal('0.5'),
    lastCheckedAt: null, createdAt: new Date(), updatedAt: new Date(),
  };
  const items = await collectorFor(source).collect(source, { fetchPage, log: () => undefined });
  return items.slice(0, 3).flatMap(item => {
    const url = safePublicLink(item.url);
    if (!url || !item.rawText.trim()) return [];
    const imageUrl = item.imageUrl && isPersistableImageUrl(item.imageUrl) ? item.imageUrl : undefined;
    const lines = item.rawText.split(/[\r\n]/).map(line => line.replace(/[\t ]+/g, ' ').trim()).filter(Boolean);
    return [{ url, title: lines[0]?.slice(0, 180) ?? 'Материал источника',
      text: lines.filter((line, index) => index === 0 || line !== lines[index - 1]).join('\n').slice(0, 1200), imageUrl,
      imageWarning: imageUrl ? undefined : item.imageUrl ? 'Домен изображения пока не поддерживается. Нужна настройка.' : 'Изображение не найдено в исходном материале.',
    }];
  });
}
