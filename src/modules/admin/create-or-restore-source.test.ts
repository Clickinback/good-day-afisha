import assert from 'node:assert/strict';
import test from 'node:test';
import { createOrRestoreSource } from './create-or-restore-source';

const data = { name: 'Updated source', type: 'WEBSITE' as const, url: 'https://example.com/events', active: false, collectionMethod: 'HTML' as const, config: {} };

function fixture(state: 'deleted' | 'live' | 'missing') {
  const rows = state === 'missing' ? [] : [{
    ...data, id: 'original-id', name: 'Original', active: state === 'live',
    deletedAt: state === 'deleted' ? new Date('2026-10-30') : null,
  }];
  const history = { eventSource: [{ sourceId: 'original-id', eventId: 'published' }], events: [{ id: 'published', status: 'PUBLISHED', imageUrl: '/media/events/poster.webp' }] };
  const logs: unknown[] = [];
  const tx = {
    source: {
      updateMany: async ({ where, data: changes }: { where: { type: string; url: string; deletedAt: { not: null } }; data: typeof data & { deletedAt: null } }) => {
        assert.deepEqual(where.deletedAt, { not: null });
        const row = rows.find(r => r.type === where.type && r.url === where.url && r.deletedAt !== null);
        if (!row) return { count: 0 };
        Object.assign(row, changes); return { count: 1 };
      },
      findUniqueOrThrow: async () => rows[0],
      create: async ({ data: changes }: { data: typeof data }) => {
        if (rows.some(r => r.type === changes.type && r.url === changes.url)) throw Object.assign(new Error('duplicate'), { code: 'P2002' });
        const row = { ...changes, id: 'new-id', deletedAt: null };
        rows.push(row); return row;
      },
    },
    moderationLog: { create: async (args: unknown) => { logs.push(args); } },
  };
  const guarded = new Proxy(tx, { get(target, key, receiver) {
    assert(['source', 'moderationLog'].includes(String(key)), 'Unexpected access to event/history tables');
    return Reflect.get(target, key, receiver);
  } }) as unknown as Parameters<typeof createOrRestoreSource>[0];
  return { tx: guarded, rows, history, logs };
}

test('re-adding deleted source keeps its identity and existing event links and applies new settings', async () => {
  const f = fixture('deleted');
  const history = JSON.stringify(f.history);
  const result = await createOrRestoreSource(f.tx, data);
  assert.equal(result.id, 'original-id');
  assert.equal(result.deletedAt, null);
  assert.equal(result.active, false);
  assert.equal(result.name, data.name);
  assert.equal(f.rows.length, 1);
  assert.equal(f.logs.length, 1);
  assert.equal(JSON.stringify(f.history), history);
});

test('restoration accepts enabled state after caller activation validation', async () => {
  const f = fixture('deleted');
  const result = await createOrRestoreSource(f.tx, { ...data, active: true });
  assert.equal(result.active, true);
});

test('existing live source is not overwritten by another create request', async () => {
  const f = fixture('live');
  const before = JSON.stringify(f.rows);
  await assert.rejects(createOrRestoreSource(f.tx, data), { code: 'P2002' });
  assert.equal(JSON.stringify(f.rows), before);
  assert.equal(f.logs.length, 0);
});

test('new URL creates a new source without a restoration audit entry', async () => {
  const f = fixture('missing');
  const result = await createOrRestoreSource(f.tx, data);
  assert.equal(result.id, 'new-id');
  assert.equal(f.logs.length, 0);
});

test('repeated submission cannot overwrite a source already restored', async () => {
  const f = fixture('deleted');
  await createOrRestoreSource(f.tx, data);
  await assert.rejects(createOrRestoreSource(f.tx, { ...data, name: 'Stale submission' }), { code: 'P2002' });
  assert.equal(f.rows[0].name, data.name);
  assert.equal(f.logs.length, 1);
});
