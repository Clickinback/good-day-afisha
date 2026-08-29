# AI Event Parser

Parser использует OpenAI Responses API и строгий `json_schema`. Все поля схемы обязательны, а неизвестные значения представлены `null`; `additionalProperties` запрещён. После ответа выполняется независимая Zod-проверка.

Исходный текст явно маркируется как недоверенный. Prompt запрещает выполнять инструкции из публикации, пользоваться внешними знаниями и додумывать значения. Для ненулевых полей модель возвращает evidence — короткие цитаты из источника.

## Жизненный цикл

1. Worker атомарно переводит `NEW → PROCESSING`.
2. Responses API возвращает structured output.
3. Не-событие получает `REJECTED`, событие — `PROCESSED`.
4. Ошибка получает `FAILED`, текст ошибки и агрегированную запись `SystemError`.
5. Сохраняются parser version, model, response id, token usage и timestamp.

Worker не создаёт Event: это намеренная граница. В PHASE 7 parsed result сначала проходит deduplication, после чего создаётся новое событие или связь `EventSource`.

Запуск: `pnpm process 10` или `POST /api/internal/raw-events/process` с Bearer `CRON_SECRET`. Тело `{"limit":10}` обрабатывает очередь, `{"rawEventId":"..."}` — одну запись.

Обязательные environment variables: `OPENAI_API_KEY` и `OPENAI_EVENT_PARSER_MODEL`. Название модели не зашито в код и сохраняется рядом с каждым результатом для воспроизводимости.
