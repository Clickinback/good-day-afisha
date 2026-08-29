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

## Резервная копия базы

```bash
docker compose --env-file .env.production -f docker-compose.production.yml exec -T database \
  pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > good-day-$(date +%F).sql.gz
```

Каталог `public/media` также нужно регулярно копировать: в нём находятся загруженные изображения мероприятий.
