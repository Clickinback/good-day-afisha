#!/bin/sh
set -eu

mkdir -p /app/public/media

if [ -d /app/media-seed ] && [ -z "$(find /app/public/media -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]; then
  cp -R /app/media-seed/. /app/public/media/
fi

exec pnpm start --hostname 0.0.0.0 --port "${PORT:-10000}"

