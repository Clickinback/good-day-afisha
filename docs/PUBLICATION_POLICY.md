# Trust score и автопубликация

`publishConfidence` рассчитывается политикой `publish-policy-v1`:

- AI confidence — 50%;
- максимальный trust score независимого источника — 35%;
- полнота карточки — 15%;
- каждый дополнительный независимый источник добавляет 0.04, максимум 0.08.

Полнота учитывает описание, изображение, место, дату и время, известную стоимость, возраст, билетную ссылку, организатора и дату окончания.

Решения:

- `>= 0.90` → `PUBLISHED / APPROVED`;
- `0.65–0.899` → `PENDING / PENDING`;
- `< 0.65` → `DRAFT / PENDING`.

Политика применяется только к `additionMethod=AUTOMATIC`. Она не снимает с публикации уже опубликованные события при последующем изменении trust score. Каждая оценка сохраняет score, breakdown, версию policy и audit log.

Запуск: `pnpm publish 50` или `POST /api/internal/publication/run` с Bearer `CRON_SECRET`.
