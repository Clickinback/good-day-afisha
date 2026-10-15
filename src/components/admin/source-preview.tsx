'use client';

import { useState } from 'react';
import type { SourcePreviewItem, SourcePreviewState } from '@/modules/collectors/source-preview';
import styles from './source-form.module.css';

function PreviewImage({ item }: { item: SourcePreviewItem }) {
  const [failed, setFailed] = useState(false);
  return item.imageUrl && !failed
    // Remote source image: not cached/optimised or saved during a read-only preview.
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={item.imageUrl} alt={`Изображение: ${item.title}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setFailed(true)} />
    : <div className={styles.noImage}>{failed ? 'Изображение не загрузилось' : item.imageWarning ?? 'Без изображения'}</div>;
}

export function SourcePreview({ result }: { result: SourcePreviewState }) {
  return <div className={result.ok ? styles.success : styles.failure}>
    <p>{result.message}</p>
    {result.items?.length ? <><p className={styles.help}>Это исходные материалы, не результат ИИ-разбора. Проверьте, что здесь анонсы нужного города, а не только новости.</p>
      <ul className={styles.previews}>{result.items.map((item, index) => <li key={`${item.url}-${index}`}>
        <PreviewImage key={item.imageUrl} item={item} />
        <div><h3><a href={item.url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3><p className={styles.excerpt}>{item.text}</p></div>
      </li>)}</ul></> : null}
  </div>;
}
