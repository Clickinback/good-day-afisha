'use client';

import { useActionState, useState } from 'react';
import { deleteSource } from '@/app/admin/delete-source-action';

export function DeleteSourceButton({ id, name }: { id: string; name: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteSource, { ok: false });
  if (state.ok) return <p role="status">{state.message}</p>;
  if (!confirming) return <button type="button" style={{ color: '#a5261d', background: '#fff', border: '1px solid #d9b7b2', borderRadius: 7, padding: '8px 11px', cursor: 'pointer' }} onClick={() => setConfirming(true)} aria-label={`Удалить источник «${name}»`}>Удалить источник</button>;
  return <form action={action} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flexBasis: '100%', minWidth: 0 }}>
    <input type="hidden" name="id" value={id} />
    <p style={{ flexBasis: '100%', overflowWrap: 'anywhere' }}>Удалить источник «{name}»? Он исчезнет из списка, сбор прекратится. Все уже созданные события, включая опубликованные, их постеры и расписание останутся. История источника сохранится в базе.</p>
    <button name="confirm" value="yes" style={{ background: '#a5261d', color: '#fff' }} disabled={pending}>{pending ? 'Удаляем…' : 'Да, удалить источник'}</button>
    <button type="button" disabled={pending} onClick={() => setConfirming(false)}>Отмена</button>
    {state.message ? <p role="alert" style={{ flexBasis: '100%' }}>{state.message}</p> : null}
  </form>;
}
