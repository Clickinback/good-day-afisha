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

4. Запустите стек:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
   ```

5. Проверьте состояние:

   ```bash
   docker compose --env-file .env.production -f docker-compose.production.yml ps
   curl https://ВАШ-ДОМЕН/api/health
   ```

Caddy автоматически получает и обновляет HTTPS-сертификат. Миграции Prisma выполняются до запуска приложения. Планировщик запускает полный цикл сбора с интервалом `PIPELINE_INTERVAL_SECONDS`.

## Обновление

```bash
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
docker image prune -f
```

## Журналы

```bash
docker compose --env-file .env.production -f docker-compose.production.yml logs -f app scheduler caddy
```

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
