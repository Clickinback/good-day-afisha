# Collectors

Каждый collector реализует `supports(Source)` и `collect(Source, CollectorContext)`. Он возвращает `CollectedItem`, но не создаёт Event и не зависит от AI parser. `collectSource` отвечает за `CollectorRun`, сохранение `RawEvent`, идемпотентность, счётчики и `SystemError`.

WebsiteCollector сначала ищет Schema.org Event в JSON-LD. Если разметки нет, использует ссылки и detail selectors из `Source.config`:

```json
{
  "itemSelector": ".event-card",
  "linkSelector": "a.event-card__link",
  "titleSelector": "h1",
  "descriptionSelector": ".event-description",
  "imageSelector": "meta[property='og:image']",
  "dateSelector": "time",
  "maxItems": 30,
  "delayMs": 800,
  "respectRobots": true
}
```

`TelegramCollector` работает с публичной страницей канала `https://t.me/s/channel`, сохраняет идентификатор поста, текст, дату и доступное изображение. По умолчанию пересланные публикации пропускаются; для городского официального канала их можно включить через `{"includeForwarded":true,"maxItems":20}`.

## Защита

- только HTTP/HTTPS без credentials;
- DNS проверяется до каждого запроса и redirect, private/local ranges запрещены;
- ограничены redirects, timeout и размер ответа;
- `robots.txt` проверяется fail-closed;
- 429/5xx повторяются с exponential backoff;
- cron endpoint требует независимый `CRON_SECRET`.

Запуск: `pnpm collect` либо `POST /api/internal/collectors/run` с `Authorization: Bearer $CRON_SECRET`. Пустое JSON-тело запускает все активные источники, `{"sourceId":"..."}` — один.
