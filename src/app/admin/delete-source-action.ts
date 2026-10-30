'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';
import { softDeleteSource, SourceBusyError } from '@/modules/admin/delete-source';

export type DeleteSourceState = { ok: boolean; message?: string };

export async function deleteSource(_: DeleteSourceState, formData: FormData): Promise<DeleteSourceState> {
  await requireAdmin();
  const id = formData.get('id');
  if (typeof id !== 'string' || !id || id.length > 200 || formData.get('confirm') !== 'yes') {
    return { ok: false, message: 'Подтвердите удаление источника.' };
  }
  try { await prisma.$transaction(tx => softDeleteSource(tx, id)); }
  catch (error) { return { ok: false, message: error instanceof SourceBusyError ? error.message : 'Не удалось удалить источник. Повторите позже.' }; }
  revalidatePath('/admin/sources');
  revalidatePath(`/admin/sources/${id}/edit`);
  revalidatePath('/admin/automation');
  return { ok: true, message: 'Источник удалён. События сохранены.' };
}
