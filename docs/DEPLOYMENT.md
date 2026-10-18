# Публикация Good Day Афиши на VPS

## Требования

- VPS с Ubuntu 24.04, публичным IPv4 и минимум 2 CPU / 4 GB RAM.
- Домен с A-записью, направленной на IP сервера.
- Установленные Docker Engine и Docker Compose.
- Открытые входящие порты 80 и 443. Порт PostgreSQL наружу не публикуется.

## Первый запуск

1. Перенесите проект на сервер и перейдите в его каталог.
2. Создайте production-конфигурацию:

   ```bash
   cp .env.production.example .env.production
   ```

3. Замените домен и все значения `replace-with-...`. Секреты можно создать командой:

   ```bash
   openssl rand -base64 48
   ```

4. Если на VPS уже работает общий reverse proxy, запустите приложение без встроенного Caddy:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
   ```

   Для отдельного VPS без другого reverse proxy включите профиль со встроенным Caddy:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml --profile standalone-proxy up -d --build
   ```

5. Проверьте состояние:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml ps
   curl https://ВАШ-ДОМЕН/api/health
   ```

При использовании профиля `standalone-proxy` Caddy автоматически получает и обновляет HTTPS-сертификат. Если используется общий reverse proxy другого стека, он должен направлять домен на контейнер приложения. Миграции Prisma выполняются до запуска приложения. Планировщик запускает полный цикл сбора с интервалом `PIPELINE_INTERVAL_SECONDS`.

## Обновление

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
docker image prune -f
```

### Постеры и постоянное хранилище

Собранные изображения записываются приложением в `/app/public/media/events` и отдаются
через маршрут `/media/events/<имя файла>`. Каталог **обязательно** должен быть постоянным:
в штатном Compose он привязан к `./public/media` на хосте. Если запуск использует
дополнительный Compose override, проверьте итоговую конфигурацию и mount контейнера
перед пересозданием `app`:

```bash
docker compose --env-file .env.production -f docker-compose.production.yml config
docker inspect afisha-app --format '{{json .Mounts}}'
```

Убедитесь, что `/app/public/media` указывает на каталог проекта с существующими
изображениями и входит в резервную копию. Не запускайте пересборку без этого mount:
файлы, оставшиеся только в файловой системе контейнера, пропадут. Если старые URL
уже отвечают 404, после восстановления mount выполните один контрольный сбор
источника: коллектор повторно скачает отсутствующие изображения. Проверяйте
конкретный URL `/media/events/...` на ответ 200 и `Content-Type: image/*`.

## Контекст и кэш сборки на общем VPS

`.dockerignore` исключает `.git`, `node_modules`, `.next*`, `public/media`,
`backups`, `deployment-transfer`, `.moved-remnants` и `coverage`.
Это **не удаляет** файлы на хосте: постеры продолжают подключаться через
`./public/media:/app/public/media`. Статические файлы `public/brand` и прочие
ресурсы вне `public/media` остаются в образе. Не меняйте mount при обновлении.

Если контекст всё ещё измеряется гигабайтами, перед следующей сборкой проверьте
`pwd`, `git rev-parse --short HEAD`, `cat .dockerignore`, фактический `build.context`
и выбранный Dockerfile в итоговой Compose-конфигурации с **тем же override**.
Файл `<имя Dockerfile>.dockerignore`, если он есть, имеет приоритет над корневым.
Размер передачи смотрите в `--progress=plain` на шаге `load build context`.
Большой контекст увеличивает передачу, но сам по себе не доказывает причину
остановки сборки: проверьте также код выхода, свободную память, OOM и логи Docker.
Документация: https://docs.docker.com/build/concepts/context/#dockerignore-files

Длительную серверную сборку запускайте в `tmux` либо через `nohup` с отдельным
логом и сохранением кода выхода, сохраняя штатные аргументы Compose/override.
Не считайте запуск фонового процесса успешным деплоем: дождитесь завершения,
проверьте health и mount, затем снимите паузу автоматизации. Для изменения только
`.dockerignore` немедленно пересоздавать работающий контейнер не требуется.

Очистка build cache затрагивает **общий builder**, а не только Афишу. Поэтому
расписание устанавливает администратор VPS после проверки используемого builder
и согласования с владельцами остальных стеков. Не добавляйте очистку в scheduler
приложения и не используйте `docker system prune --volumes`.

Предлагаемая политика: раз в неделю в согласованное окно без сборок удалять
неиспользуемый build cache старше 7 дней:

```bash
docker builder prune --all --filter 'until=168h' --force
```

Это команда для согласованного обслуживания, **не уже установленное расписание**.
Она не удаляет контейнеры, volumes и теги образов; последующие сборки других
проектов могут замедлиться из-за потери кэша. До и после фиксируйте `df -h` и
`docker system df`. Возрастной фильтр не является жёстким лимитом размера:
при частых сборках дополнительно нужны наблюдение за диском и настроенный GC
конкретного builder. Не запускайте очистку одновременно с деплоем.
Параметры команды: https://docs.docker.com/reference/cli/docker/builder/prune/

## Журналы

```bash
docker compose --env-file .env.production -f docker-compose.production.yml logs -f app scheduler caddy
```

Для всех production-контейнеров используется Docker logging driver `local`. Каждый контейнер хранит не более пяти сжатых файлов по 20 МБ, поэтому журналы не могут бесконтрольно заполнить диск VPS.

## Автоматические резервные копии

```bash
chmod +x scripts/backup-production.sh
./scripts/backup-production.sh
```

Скрипт сохраняет PostgreSQL и каталог `public/media`, создаёт контрольные суммы и удаляет локальные копии старше 14 дней. По умолчанию архивы находятся в `backups/`. Путь и срок хранения можно изменить переменными `BACKUP_DIR` и `BACKUP_RETENTION_DAYS`.

Если настроен зашифрованный remote `rclone`, укажите `BACKUP_REMOTE`. После загрузки скрипт сверяет локальную и облачную копии. Облачные копии по умолчанию хранятся 90 дней:

```bash
BACKUP_REMOTE='gcrypt:' BACKUP_REMOTE_RETENTION_DAYS=90 ./scripts/backup-production.sh
```

Для ежедневного запуска в 03:15 добавьте задачу от пользователя, который управляет Docker:

```bash
(crontab -l 2>/dev/null; echo "15 3 * * * cd /ПУТЬ/К/good-day-afisha && BACKUP_REMOTE='gcrypt:' BACKUP_REMOTE_RETENTION_DAYS=90 ./scripts/backup-production.sh >> backups/backup.log 2>&1") | crontab -
```

После первого запуска обязательно проверьте локальный каталог, файл `SHA256SUMS` и наличие новой зашифрованной папки через `rclone lsf gcrypt:`. Никогда не храните ключ `rclone crypt` только на VPS.
