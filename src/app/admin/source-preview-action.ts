'use server';

import { requireAdmin } from '@/lib/admin-auth';
import { sourceFormSchema } from '@/modules/admin/schemas';
import { createSourceCheck } from '@/modules/admin/source-check';
import { sourceFormValues, sourcePreset } from '@/modules/collectors/source-presets';
import { previewSourceItems, type SourcePreviewState } from '@/modules/collectors/source-preview';

export async function previewSource(formData: FormData): Promise<SourcePreviewState> {
  await requireAdmin();
  const values = Object.fromEntries(formData.entries());
  const parsed = sourceFormSchema.safeParse(sourceFormValues({ ...values, name: values.name || 'Проверка источника' }));
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Проверьте ссылку и настройки' };
  if (values.setupMode === 'automatic' && !sourcePreset(parsed.data.url)) {
    return { ok: false, message: 'Требуется настройка подключения. Для этой ссылки нет готового шаблона. Сохраните источник выключенным и передайте ссылку разработчику.' };
  }
  try {
    const items = await previewSourceItems(parsed.data);
    if (!items.length) return { ok: false, message: 'Материалы не найдены. Проверьте ссылку; возможно, пока нет анонсов или сайт изменился. Источник можно сохранить выключенным.' };
    return {
      ok: true, message: `Проверка пройдена. Показаны примеры материалов: ${items.length}. Это не полный список и не опубликованные события.`,
      items, token: createSourceCheck(parsed.data, process.env.AUTH_SECRET ?? ''),
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : '';
    const message = /Schema.org|itemSelector|linkSelector/.test(detail)
      ? 'На странице не найдены события по текущим правилам. Требуется настройка подключения.'
      : /Telegram/.test(detail) ? 'Нет доступных сообщений. Нужна ссылка на публичный Telegram-канал с текстовыми постами.'
        : /abort|timeout|fetch failed/i.test(detail) ? 'Сайт не ответил вовремя. Повторите проверку позже.'
          : detail || 'Не удалось проверить источник. Повторите позже.';
    return { ok: false, message };
  }
}
