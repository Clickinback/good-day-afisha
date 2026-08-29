# План разработки

## PHASE 1 — foundation

- [x] Аудит репозитория и стека (репозиторий был пуст)
- [x] ADR архитектуры, структура модулей и нормализованная Prisma-схема
- [x] Next.js/TypeScript/Tailwind foundation, environment template
- [x] Доменные типы и data repository boundary

## PHASE 2 — публичный MVP

- [x] Главная, выбор Полоцка/Новополоцка, быстрые сценарии
- [x] Городские страницы, категории, фильтры и текстовый поиск
- [x] Карточка и детальная страница события
- [x] Read-only API v1
- [x] Базовые metadata, robots, sitemap, JSON-LD Event

## Следующие задачи

1. PHASE 3: ✅ защищённый admin layout, ручной CRUD Event, moderation queue и audit log. До production остаются внешний identity provider/RBAC и media upload.
2. PHASE 4: ✅ CRUD Source, immutable RawEvent explorer, collector runs и сгруппированные system errors.
3. PHASE 5: ✅ collector contract, SSRF/HTTP/robots policies, idempotency, retry/backoff и первый WebsiteCollector.
4. PHASE 6: ✅ Responses API Structured Outputs parser, prompt/model audit, token logging, queue worker и validation tests.
5. PHASE 7: ✅ candidate retrieval, weighted explainable score, auto-link и ручной merge/dismiss workflow.
6. PHASE 8: ✅ configurable trust policy, explainable publishConfidence и autopublish job. Cancellation/reschedule handling переносится в lifecycle phase.
7. PHASE 9: ✅ DB-first public repository, lifecycle, cancellation/reschedule handling, dynamic OG, sitemap and SEO archive.
8. PHASE 10: ✅ automatic collection rules, pinned/excluded editorial overrides, public pages/API and Telegram renderer.

## Основные риски

- Юридические условия и robots.txt источников; нужен реестр разрешений и лимитов.
- Неполные/неоднозначные даты, timezone и переносы; хранить evidence и parser version.
- Дубликаты между городами и сериями событий; нельзя полагаться только на fuzzy title.
- Авторские права на изображения; нужны provenance, лицензия и безопасный placeholder.
- SEO-дубли фильтров; индексировать только канонические landing pages.
- Безопасность admin/jobs; отдельные роли, CSRF-safe actions, rate limiting и secret rotation.
- Рост PostgreSQL из-за raw HTML; в production большие payload лучше вынести в object storage.
