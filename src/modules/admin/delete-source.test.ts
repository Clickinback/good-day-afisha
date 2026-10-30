import assert from 'node:assert/strict';
import test from 'node:test';
import { softDeleteSource, SourceBusyError } from './delete-source';

function fixture(running = false) {
  const source = { id: 'source-1', active: true, deletedAt: null as Date | null };
  const events = [{ id: 'published', status: 'PUBLISHED', imageUrl: '/media/events/poster.webp' }, { id: 'pending', status: 'PENDING' }];
  const occurrences = [{ eventId: 'published', startsAt: '2026-11-01T15:00:00Z' }];
  const links = [{ sourceId: source.id, eventId: 'published' }];
  const logs: unknown[] = [];
  const tx = {
    source: { updateMany: async ({ where, data }: { where: { id: string; deletedAt: null }; data: { active: boolean; deletedAt: Date } }) => {
      assert.equal(where.deletedAt, null);
      if (where.id !== source.id || source.deletedAt) return { count: 0 };
      Object.assign(source, data); return { count: 1 };
    } },
    collectorRun: { count: async () => running ? 1 : 0 },
    moderationLog: { create: async (args: unknown) => { logs.push(args); } },
  } as unknown as Parameters<typeof softDeleteSource>[0];
  const guarded = new Proxy(tx, { get(target, key, receiver) {
    assert(['source', 'collectorRun', 'moderationLog'].includes(String(key)), `Unexpected mutation capability: ${String(key)}`);
    return Reflect.get(target, key, receiver);
  } });
  return { source, events, occurrences, links, logs, tx: guarded };
}

test('source deletion disables and archives only the source; published and pending events, posters, occurrences and provenance stay intact', async () => {
  const f = fixture();
  const before = JSON.stringify([f.events, f.occurrences, f.links]);
  const now = new Date('2026-10-30T12:00:00Z');
  await softDeleteSource(f.tx, 'source-1', now);
  assert.equal(f.source.active, false);
  assert.equal(f.source.deletedAt, now);
  assert.equal(JSON.stringify([f.events, f.occurrences, f.links]), before);
  assert.equal(f.logs.length, 1);
});

test('repeated deletion is idempotent and does not create duplicate audit records', async () => {
  const f = fixture();
  await softDeleteSource(f.tx, 'source-1');
  const deletedAt = f.source.deletedAt;
  await softDeleteSource(f.tx, 'source-1');
  assert.equal(f.source.deletedAt, deletedAt);
  assert.equal(f.logs.length, 1);
});

test('an in-flight collector rejects deletion so the caller transaction can roll back', async () => {
  const f = fixture(true);
  await assert.rejects(softDeleteSource(f.tx, 'source-1'), SourceBusyError);
  assert.equal(f.logs.length, 0);
});

test('a missing source is a harmless no-op', async () => {
  const f = fixture();
  await softDeleteSource(f.tx, 'absent');
  assert.equal(f.source.active, true);
  assert.equal(f.source.deletedAt, null);
  assert.equal(f.logs.length, 0);
});
