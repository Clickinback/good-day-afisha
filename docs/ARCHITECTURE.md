# Good Day Афиша — архитектура MVP

## Решение

Модульный монолит на Next.js App Router. UI использует Server Components для чтения, mutations позднее идут через Server Actions, а `/api/v1` остаётся стабильным транспортным слоем для Telegram-бота, Mini App и мобильных клиентов. PostgreSQL — источник истины; Prisma отвечает за типизированный доступ и миграции.

Домены: `catalog` (города, площадки, категории), `events`, `ingestion` (источники и raw events), `moderation`, `collections`, `jobs`. Коллекторы реализуют единый контракт и не импортируются UI-слоем. Их запуск происходит через job handlers, сначала cron, позже очередь без изменения доменной логики.

## Поток данных

`Source → Collector → RawEvent → AI Parser → Deduplication → Moderation/Autopublish → Event → API/UI`.

Пороговые значения автопубликации хранятся в конфигурации, а каждое решение оставляет audit trail в `ModerationLog`. `EventSource` обеспечивает many-to-many связь одного события с несколькими подтверждающими источниками.

## Границы и решения

- Даты хранятся в UTC, timezone принадлежит городу.
- Цена — decimal и ISO-подобный код валюты; бесплатность хранится явно для быстрых запросов.
- Адрес в Event сохраняется snapshot-ом, даже если площадка позже изменится.
- Сырые документы отделены от опубликованных событий; повторная AI-обработка безопасна.
- Slug города — единственный параметр маршрута, поэтому новый город не требует кода.
- На MVP repository имеет fallback-набор данных, чтобы UI запускался без локального PostgreSQL. Подключение Prisma изолировано в data layer.

## Структура

```text
src/
  app/                 routes, metadata, API
  components/          reusable UI
  modules/events/      event domain types, queries, policies
  data/                repositories and demo adapter
  lib/                 shared infrastructure
prisma/                 normalized schema and migrations
docs/                   ADR, plan, operational notes
```
