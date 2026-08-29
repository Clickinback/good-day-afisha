# Автоматические подборки

`Collection.rule` хранит типизированное правило: период, категория, бесплатно, детям, вечер и лимит. Генератор создаёт пять базовых подборок для каждого активного города, поэтому новый город не требует изменений кода.

Редактор может закрепить событие через `CollectionEvent.pinned` или исключить его через `CollectionExclusion`. Повторная генерация сохраняет эти решения и заменяет только автоматическую часть.

Запуск: `pnpm collections` либо `POST /api/internal/collections/generate` с Bearer-токеном `CRON_SECRET`.

Публичный API:

- `GET /api/v1/collections?city=polotsk`
- `GET /api/v1/collections/today?city=polotsk`
- `GET /api/v1/collections/today?city=polotsk&format=telegram`
