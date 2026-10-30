import type { Prisma } from '@prisma/client';

export class SourceBusyError extends Error {}

// Deliberately has no Event/EventOccurrence/media delete capability.
export async function softDeleteSource(
  tx: Pick<Prisma.TransactionClient, 'source' | 'collectorRun' | 'moderationLog'>,
  id: string,
  now = new Date(),
) {
  // This update locks the source row, serializing with collector startup.
  const changed = await tx.source.updateMany({ where: { id, deletedAt: null }, data: { active: false, deletedAt: now } });
  if (!changed.count) return;
  if (await tx.collectorRun.count({ where: { sourceId: id, status: 'RUNNING' } })) {
    throw new SourceBusyError('Источник сейчас собирается. Дождитесь завершения сбора и повторите удаление.');
  }
  await tx.moderationLog.create({ data: {
    actorId: 'environment-admin', action: 'EDITED',
    reason: 'Источник удалён из списка. События, расписание и история сохранены.',
    after: { sourceId: id, active: false, deletedAt: now.toISOString() },
  } });
}
