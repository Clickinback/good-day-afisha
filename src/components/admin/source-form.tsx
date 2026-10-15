"use client";

import Link from 'next/link';
import { useActionState, useRef, useState, useTransition } from 'react';
import { createSource, updateSource } from '@/app/admin/actions';
import { previewSource } from '@/app/admin/source-preview-action';
import { sourcePreset } from '@/modules/collectors/source-presets';
import type { SourcePreviewState } from '@/modules/collectors/source-preview';
import { SourcePreview } from './source-preview';
import styles from './source-form.module.css';

type Initial = { id: string; name: string; type: string; url: string; cityId: string; trustScore: string; collectionMethod: string; active: boolean; config: string };

export function SourceForm({ cities, initial }: { cities: { id: string; name: string }[]; initial?: Initial }) {
  const [state, action, pending] = useActionState(initial ? updateSource.bind(null, initial.id) : createSource, { ok: false });
  const [url, setUrl] = useState(initial?.url ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [cityId, setCityId] = useState(initial?.cityId ?? '');
  const [trustScore, setTrustScore] = useState(initial?.trustScore ?? '0.5');
  const [automatic, setAutomatic] = useState(!initial);
  const [custom, setCustom] = useState({ type: initial?.type ?? 'WEBSITE', collectionMethod: initial?.collectionMethod ?? 'HTML', config: initial?.config || '{}' });
  const [active, setActive] = useState(initial?.active ?? false);
  const [preview, setPreview] = useState<SourcePreviewState | null>(null);
  const [checking, startCheck] = useTransition();
  const form = useRef<HTMLFormElement>(null);
  const preset = sourcePreset(url);
  const busy = pending || checking;
  const unchanged = !!initial && url.trim() === initial.url && !automatic && custom.type === initial.type
    && custom.collectionMethod === initial.collectionMethod && custom.config === (initial.config || '{}');
  const canActivate = preview?.ok || (initial?.active && unchanged);
  const error = (field: string) => state.errors?.[field]?.[0];

  function invalidate() { setPreview(null); setActive(false); }
  function switchMode() {
    if (automatic && preset) setCustom({ type: preset.type, collectionMethod: preset.collectionMethod, config: JSON.stringify(preset.config, null, 2) });
    setAutomatic(!automatic);
    invalidate();
  }
  function check() {
    if (!form.current) return;
    const data = new FormData(form.current);
    setPreview(null);
    startCheck(async () => {
      try { setPreview(await previewSource(data)); }
      catch { setPreview({ ok: false, message: 'Проверка не завершилась. Обновите страницу, проверьте вход в админку и повторите.' }); }
    });
  }

  return <form ref={form} action={action} className={`admin-form ${styles.form}`}>
    <input type="hidden" name="setupMode" value={automatic ? 'automatic' : 'manual'} />
    <input type="hidden" name="previewToken" value={preview?.token ?? ''} />
    <fieldset disabled={busy} className={styles.fields}>
      <section className="form-section">
        <div className="form-section-title"><span>01</span><div><h2>Откуда брать события</h2><p>Вставьте ссылку. Для поддерживаемых источников настройки подберутся автоматически.</p></div></div>
        <div className="form-grid">
          <label className="wide">Ссылка на источник
            <input name="url" type="url" value={url} onChange={event => { setUrl(event.target.value); invalidate(); }} required placeholder="https://t.me/название_канала" autoComplete="off" />
            <small>{error('url')}</small>
          </label>
          <div className={`wide ${styles.notice}`} aria-live="polite">
            {automatic ? preset ? <><strong>{preset.label}</strong><p>{preset.hint}</p><p>Адрес сбора: <span className={styles.url}>{preset.url}</span></p></> : <><strong>{url ? 'Требуется настройка подключения' : 'JSON заполнять не нужно'}</strong><p>{url ? 'Для этой ссылки нет готового шаблона. Можно сохранить источник выключенным и передать ссылку разработчику.' : 'Поддерживаются публичные Telegram-каналы, страницы площадок Ticketpro и афиша HUBL для Новополоцка.'}</p></>
              : <><strong>Сохранённые / ручные настройки</strong><p>Используем параметры из расширенных настроек. Они не заменяются автоматически при редактировании.</p>{preset ? <><p>Для этой ссылки есть готовый шаблон: {preset.label}. Он заменит ручные параметры.</p><button type="button" className={styles.checkButton} onClick={() => { setAutomatic(true); invalidate(); }}>Использовать готовые настройки</button></> : null}</>}
          </div>
          <label>Название для списка<input name="name" value={name} onChange={event => setName(event.target.value)} required={!automatic} placeholder={preset?.label ?? 'Например: ДК «Нафтан»'} /><small>{error('name')}</small></label>
          <label>Город<select name="cityId" value={cityId} onChange={event => setCityId(event.target.value)}><option value="">Все города</option>{cities.map(city => <option value={city.id} key={city.id}>{city.name}</option>)}</select><small>{error('cityId')}</small></label>
        </div>
      </section>

      <section className="form-section">
        <div className="form-section-title"><span>02</span><div><h2>Проверить и включить</h2><p>Сначала посмотрите, что удаётся получить по ссылке.</p></div></div>
        <div className={styles.checkArea}>
          <button type="button" className={styles.checkButton} onClick={check} disabled={!url.trim() || (automatic && !preset)}>{checking ? 'Проверяем источник…' : 'Проверить источник'}</button>
          <p className={styles.help}>До 3 примеров. Без сохранения событий, публикации и расхода токенов OpenAI. Проверка может занять до 35 секунд.</p>
          <div role="status" aria-live="polite">{checking ? <p>Читаем страницу и проверяем доступность материалов…</p> : preview ? <SourcePreview result={preview} /> : null}</div>
          <label className={styles.activation}><input name="active" type="checkbox" value="true" checked={active && !!canActivate} disabled={!canActivate} onChange={event => setActive(event.target.checked)} />Включить автоматический сбор</label>
          <p className={styles.help}>После проверки поставьте галочку и сохраните. Сбор начнётся в ближайшем плановом цикле; события пройдут обычные проверки и модерацию. Без галочки источник сохранится выключенным.</p>
        </div>
      </section>

      <details className={styles.advanced}>
        <summary>Расширенные настройки — для разработчика</summary>
        <p className={styles.help}>Менеджеру менять эти поля не нужно. Пароли и ключи здесь не храните.</p>
        <label className={styles.activation}><input type="checkbox" checked={automatic} onChange={switchMode} />Подбирать настройки автоматически по ссылке</label>
        {initial && !automatic ? <p className={styles.help}>Включение автоматического подбора заменит текущую конфигурацию шаблоном. Для сохранения активным потребуется новая проверка.</p> : null}
        <div className="form-grid">
          <label>Тип<select name="type" value={automatic ? preset?.type ?? 'WEBSITE' : custom.type} disabled={automatic} onChange={event => { setCustom({ ...custom, type: event.target.value }); invalidate(); }}>
            <option value="WEBSITE">Сайт</option><option value="TELEGRAM">Telegram</option><option value="RSS">RSS (нет сборщика)</option><option value="API">API (нет сборщика)</option><option value="SOCIAL">Соцсеть (нет сборщика)</option><option value="MANUAL">Ручной</option>
          </select><small>{error('type')}</small></label>
          <label>Метод сбора<select name="collectionMethod" value={automatic ? preset?.collectionMethod ?? 'HTML' : custom.collectionMethod} disabled={automatic} onChange={event => { setCustom({ ...custom, collectionMethod: event.target.value }); invalidate(); }}>
            <option value="HTML">HTML</option><option value="TELEGRAM">Telegram</option><option value="RSS">RSS</option><option value="API">API</option><option value="MANUAL">Ручной</option>
          </select><small>{error('collectionMethod')}</small></label>
          <label>Уровень доверия (0–1)<input name="trustScore" value={trustScore} onChange={event => setTrustScore(event.target.value)} type="number" min="0" max="1" step="0.001" required /><small>{error('trustScore')}</small></label>
          <label className="wide">Конфигурация JSON<textarea name="config" value={automatic ? JSON.stringify(preset?.config ?? {}, null, 2) : custom.config} readOnly={automatic} onChange={event => { setCustom({ ...custom, config: event.target.value }); invalidate(); }} rows={8} spellCheck={false} /><small>{error('config')}</small></label>
        </div>
      </details>
    </fieldset>
    {state.message ? <p role="alert" className="form-error form-message">{state.message}</p> : null}
    <div className="form-footer"><Link href="/admin/sources">Отмена</Link><button disabled={busy}>{pending ? 'Сохраняем…' : active && canActivate ? 'Сохранить и включить' : 'Сохранить выключенным'}</button></div>
  </form>;
}
