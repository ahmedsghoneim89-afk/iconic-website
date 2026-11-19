#!/usr/bin/env bash
# Puts the CRM back as it was before install.sh. The website_sync collections are left in place (they are not used by anything else).
#   ./rollback.sh /var/backups/iconic-website-sync/<stamp>  [--restore-env]
set -euo pipefail
BK="${1:?give the backup folder printed by install.sh}"; RESTORE_ENV="${2:-}"
[ -f "$BK/INFO" ] || { echo "not a backup folder: $BK" >&2; exit 1; }
. "$BK/INFO"
echo "== restoring $crm/src/index.js"
cp -p "$BK/index.js.orig" "$crm/src/index.js"; node --check "$crm/src/index.js"
echo "== moving the module aside"
[ -d "$crm/src/websiteSync" ] && mv "$crm/src/websiteSync" "$BK/websiteSync.removed" || true
[ -d "$BK/websiteSync.prev" ] && cp -a "$BK/websiteSync.prev" "$crm/src/websiteSync" || true
if [ "$RESTORE_ENV" = "--restore-env" ]; then
  cp -p "$BK/runtime.env.orig" "${RUNTIME_ENV:-/etc/iconic-crm/runtime.env}"; [ -f "$BK/website.env.orig" ] && cp -p "$BK/website.env.orig" "$web/.env" || true; echo "== env files restored"
fi
echo "== reloading the CRM"; pm2 reload iconic-crm-server --update-env >/dev/null; sleep 5; pm2 ls | grep iconic-crm-server | head -4
echo "Done. Website side: unset CRM_* in $web/.env and run: docker compose -f docker-compose.yml -f docker-compose.nginx.yml up -d app"
