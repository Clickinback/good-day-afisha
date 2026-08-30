#!/bin/sh
set -eu

PROJECT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
ENV_FILE=${ENV_FILE:-"$PROJECT_DIR/.env.production"}
BACKUP_DIR=${BACKUP_DIR:-"$PROJECT_DIR/backups"}
BACKUP_RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-14}
BACKUP_REMOTE=${BACKUP_REMOTE:-}
BACKUP_REMOTE_RETENTION_DAYS=${BACKUP_REMOTE_RETENTION_DAYS:-90}
COMPOSE_FILE="$PROJECT_DIR/docker-compose.production.yml"
STAMP=$(date -u +%Y-%m-%dT%H-%M-%SZ)
TARGET="$BACKUP_DIR/$STAMP"
TEMP_TARGET="$BACKUP_DIR/.${STAMP}.tmp"
LOCK_DIR="$BACKUP_DIR/.backup.lock"

mkdir -p "$BACKUP_DIR"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "Another backup is already running." >&2
  exit 1
fi

cleanup() {
  rm -rf "$TEMP_TARGET"
  rmdir "$LOCK_DIR" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

mkdir -p "$TEMP_TARGET"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T database \
  sh -c 'pg_dump --format=custom --no-owner --no-privileges -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  > "$TEMP_TARGET/database.dump"

test -s "$TEMP_TARGET/database.dump"

if [ -d "$PROJECT_DIR/public/media" ]; then
  tar -C "$PROJECT_DIR/public" -czf "$TEMP_TARGET/media.tar.gz" media
else
  tar -czf "$TEMP_TARGET/media.tar.gz" --files-from /dev/null
fi

test -s "$TEMP_TARGET/media.tar.gz"
(
  cd "$TEMP_TARGET"
  sha256sum database.dump media.tar.gz > SHA256SUMS
)

mv "$TEMP_TARGET" "$TARGET"

if [ -n "$BACKUP_REMOTE" ]; then
  if ! command -v rclone >/dev/null 2>&1; then
    echo "BACKUP_REMOTE is set, but rclone is not installed." >&2
    exit 1
  fi

  REMOTE_TARGET="${BACKUP_REMOTE%/}/$STAMP"
  rclone copy "$TARGET" "$REMOTE_TARGET" --immutable
  rclone check "$TARGET" "$REMOTE_TARGET" --one-way
  rclone delete "${BACKUP_REMOTE%/}" --min-age "${BACKUP_REMOTE_RETENTION_DAYS}d"
  rclone rmdirs "${BACKUP_REMOTE%/}" --leave-root
  echo "Encrypted remote backup verified: $REMOTE_TARGET"
fi

find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d \
  -name '????-??-??T??-??-??Z' -mtime "+$BACKUP_RETENTION_DAYS" -exec rm -rf {} +

echo "Local backup created: $TARGET"
