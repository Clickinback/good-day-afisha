import { createHmac, timingSafeEqual } from 'node:crypto';
import type { SourceSetup } from '@/modules/collectors/source-presets';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => `${JSON.stringify(key)}:${canonical(item)}`).join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}

export function sourceSetupKey(setup: SourceSetup) {
  return canonical({ url: setup.url, type: setup.type, collectionMethod: setup.collectionMethod, config: setup.config ?? {} });
}

const lifetimeMs = 30 * 60 * 1000;
function signature(setup: SourceSetup, expires: number, secret: string) {
  return createHmac('sha256', secret).update(`source-preview-v1\n${expires}\n${sourceSetupKey(setup)}`).digest('hex');
}

export function createSourceCheck(setup: SourceSetup, secret: string, now = Date.now()) {
  if (secret.length < 32) throw new Error('Не настроен секрет проверки источника');
  const expires = now + lifetimeMs;
  return `${expires}.${signature(setup, expires, secret)}`;
}

export function validateSourceCheck(token: string, setup: SourceSetup, secret: string, now = Date.now()) {
  if (secret.length < 32) return false;
  const match = token.match(/^(\d{13})\.([a-f0-9]{64})$/);
  if (!match) return false;
  const expires = Number(match[1]);
  if (expires <= now || expires > now + lifetimeMs) return false;
  return timingSafeEqual(Buffer.from(match[2], 'hex'), Buffer.from(signature(setup, expires, secret), 'hex'));
}

export function needsSourceCheck(active: boolean, setup: SourceSetup, previous?: SourceSetup & { active: boolean }) {
  return active && (!previous?.active || sourceSetupKey(setup) !== sourceSetupKey(previous));
}
