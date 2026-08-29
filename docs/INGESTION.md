# Ingestion layer

`Source` содержит только публичную конфигурацию сбора. API tokens, cookies и другие секреты запрещено помещать в `config`; адаптер получает их из environment variables по безопасному идентификатору.

`RawEvent` является неизменяемым evidence-документом. Повторная обработка меняет только `processingStatus`, `parsedData` и `processingError`, но не исходные `rawText`, `rawHtml`, URL и timestamps.

Идемпотентность обеспечивается двумя уникальными ключами: `(sourceId, externalId)` и `(sourceId, url)`. Collector обязан создать `CollectorRun` перед запросом и завершить его счётчиками найденных, созданных, пропущенных и ошибочных публикаций.

`SystemError` агрегирует одинаковые операционные ошибки по fingerprint. Успешный повтор не удаляет запись, а выставляет `resolvedAt`, сохраняя историю инцидента.
