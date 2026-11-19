#!/usr/bin/env bash
# Installs the ICONIC website link into the CRM. Safe to run again. Prints no secrets.
#   CRM=/var/www/iconic-crm/server  WEB=/opt/iconic  ./install.sh
set -euo pipefail
CRM="${CRM:-/var/www/iconic-crm/server}"; WEB="${WEB:-/opt/iconic}"; RUNTIME_ENV="${RUNTIME_ENV:-/etc/iconic-crm/runtime.env}"
HERE="$(cd "$(dirname "$0")" && pwd)"; STAMP="$(date +%Y%m%d-%H%M%S)"; BK="${BACKUP_ROOT:-/var/backups/iconic-website-sync}/$STAMP"
SITE_EVENTS_URL="${SITE_EVENTS_URL:-https://www.iconicrealestateegy.com/iconic-api/catalog/events}"
CRM_SYNC_URL="${CRM_SYNC_URL:-https://api.iconicrealestateegy.com/api/website-sync}"
say() { printf '\n== %s\n' "$*"; }
die() { printf 'STOP: %s\n' "$*" >&2; exit 1; }

say "1/7 checks"
[ -f "$CRM/src/index.js" ] || die "CRM source not found at $CRM/src"
[ -f "$RUNTIME_ENV" ] || die "runtime env not found at $RUNTIME_ENV"
[ -d "$HERE/websiteSync" ] || die "websiteSync folder missing next to this script"
command -v pm2 >/dev/null || die "pm2 not found"
pm2 jlist 2>/dev/null | grep -q '"name":"iconic-crm-server"' || die "pm2 app iconic-crm-server is not running"

say "2/7 backup to $BK"
umask 077; mkdir -p "$BK/mongo"
cp -p "$CRM/src/index.js" "$BK/index.js.orig"
cp -p "$RUNTIME_ENV" "$BK/runtime.env.orig"
[ -f "$WEB/.env" ] && cp -p "$WEB/.env" "$BK/website.env.orig" || true
[ -d "$CRM/src/websiteSync" ] && cp -a "$CRM/src/websiteSync" "$BK/websiteSync.prev" || true
MONGO_URI="$(cd "$CRM" && node --input-type=module -e 'import d from "dotenv"; d.config({path:process.argv[1]}); process.stdout.write(process.env.MONGO_URI||"")' "$RUNTIME_ENV")"
[ -n "$MONGO_URI" ] || die "MONGO_URI not found in runtime env"
for c in developers projects lookups cities websitesync_state websitesync_outbox websitesync_claims; do
  mongodump --quiet --uri="$MONGO_URI" --collection="$c" --out="$BK/mongo" 2>/dev/null || echo "   (no collection $c yet, skipped)"
done
printf 'crm=%s\nweb=%s\nstamp=%s\n' "$CRM" "$WEB" "$STAMP" > "$BK/INFO"
echo "   backup ready: $BK"

say "3/7 copy the module"
rm -rf "$CRM/src/websiteSync.new"; cp -a "$HERE/websiteSync" "$CRM/src/websiteSync.new"
rm -rf "$CRM/src/websiteSync"; mv "$CRM/src/websiteSync.new" "$CRM/src/websiteSync"
for f in "$CRM"/src/websiteSync/*.js; do node --check "$f" 2>/dev/null || { cp "$f" /tmp/_chk.mjs; node --check /tmp/_chk.mjs || die "syntax problem in $f"; }; done

say "4/7 patch src/index.js (4 lines)"
node "$HERE/patch-index.mjs" "$CRM/src/index.js" || { cp -p "$BK/index.js.orig" "$CRM/src/index.js"; die "could not patch index.js; original restored"; }
node --check "$CRM/src/index.js" || { cp -p "$BK/index.js.orig" "$CRM/src/index.js"; die "patched index.js did not pass the syntax check; original restored"; }
(cd "$CRM" && node --input-type=module -e 'await import("./src/websiteSync/routes.js"); console.log("   module loads")') || { cp -p "$BK/index.js.orig" "$CRM/src/index.js"; die "module failed to load; original restored"; }

say "5/7 secrets (written to files, never printed)"
if grep -q '^WEBSITE_EVENT_SECRET=' "$RUNTIME_ENV"; then echo "   already present in $RUNTIME_ENV"; else
  ES="$(openssl rand -hex 32)"; RS="$(openssl rand -hex 32)"
  { echo ""; echo "# ICONIC website link"; echo "WEBSITE_SYNC_URL=$SITE_EVENTS_URL"; echo "WEBSITE_EVENT_SECRET=$ES"; echo "WEBSITE_REQUEST_SECRET=$RS"; } >> "$RUNTIME_ENV"
  if [ -f "$WEB/.env" ]; then
    grep -q '^CRM_EVENT_SECRET=' "$WEB/.env" || { echo ""; echo "# ICONIC CRM catalog link"; echo "CRM_SYNC_URL=$CRM_SYNC_URL"; echo "CRM_EVENT_SECRET=$ES"; echo "CRM_REQUEST_SECRET=$RS"; } >> "$WEB/.env"
    echo "   written to $RUNTIME_ENV and $WEB/.env"
  else echo "   written to $RUNTIME_ENV; $WEB/.env not found, add the CRM_* values there yourself"; fi
  unset ES RS
fi

say "6/7 reload the CRM (zero-downtime)"
pm2 reload iconic-crm-server --update-env >/dev/null
sleep 6
pm2 logs iconic-crm-server --nostream --lines 60 2>/dev/null | grep -E 'website-sync|Failed to connect' | tail -6 || true

say "7/7 check"
code="$(curl -s -o /dev/null -w '%{http_code}' https://api.iconicrealestateegy.com/api/website-sync/status || true)"
echo "   unsigned request to /api/website-sync/status -> HTTP $code (401 is correct: it needs a signature)"
echo
echo "Installed. Backup: $BK"
echo "To undo: $HERE/rollback.sh $BK"
