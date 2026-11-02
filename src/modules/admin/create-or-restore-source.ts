import type { Prisma } from '@prisma/client';

type SourceData = Pick<Prisma.SourceUncheckedCreateInput,
  'name' | 'type' | 'url' | 'cityId' | 'trustScore' | 'collectionMethod' | 'active' | 'config'>;

// Called inside a transaction, after form validation and the activation check.
export async function createOrRestoreSource(
  tx: Pick<Prisma.TransactionClient, 'source' | 'moderationLog'>,
  data: SourceData,
) {
  // Only deleted rows can be restored. Never overwrite an existing live source.
  const restored = await tx.source.updateMany({
    where: { type: data.type, url: data.url, deletedAt: { not: null } },
    data: { ...data, deletedAt: null },
  });
  if (!restored.count) return tx.source.create({ data });
  const source = await tx.source.findUniqueOrThrow({
    where: { type_url: { type: data.type, url: data.url } },
  });
  await tx.moderationLog.create({ data: {
    actorId: 'environment-admin', action: 'EDITED',
    reason: 'Удалённый источник восстановлен через форму добавления. События и история сохранены.',
    before: { sourceId: source.id, deleted: true, active: false },
    after: { sourceId: source.id, deletedAt: null, active: source.active },
  } });
  return source;
}
