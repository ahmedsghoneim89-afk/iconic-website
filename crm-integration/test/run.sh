#!/usr/bin/env bash
# Runs the CRM-side tests against a temporary MongoDB on a spare port, with a copy of the CRM's model files. Never connects to the real database.
#   ./run.sh            (CRM=/var/www/iconic-crm/server by default)
set -uo pipefail
CRM="${CRM:-/var/www/iconic-crm/server}"; HERE="$(cd "$(dirname "$0")/.." && pwd)"; PORT="${MONGO_TEST_PORT:-27999}"
T="$(mktemp -d /tmp/iconic-sync-test.XXXXXX)"
cleanup() { [ -f "$T/mongod.pid" ] && kill "$(cat "$T/mongod.pid")" 2>/dev/null; sleep 1; rm -rf "$T"; }
trap cleanup EXIT
command -v mongod >/dev/null || { echo "mongod not found on this machine"; exit 3; }
(echo > /dev/tcp/127.0.0.1/$PORT) 2>/dev/null && { echo "port $PORT is already in use; set MONGO_TEST_PORT"; exit 3; }
mkdir -p "$T/db" "$T/stage"
mongod --dbpath "$T/db" --port "$PORT" --bind_ip 127.0.0.1 --nounixsocket --fork --logpath "$T/mongod.log" --pidfilepath "$T/mongod.pid" >/dev/null || { tail -5 "$T/mongod.log"; exit 3; }
cp -a "$CRM/src" "$T/stage/src"; rm -rf "$T/stage/src/websiteSync"; cp -a "$HERE/websiteSync" "$T/stage/src/websiteSync"
cp "$CRM/package.json" "$T/stage/package.json"; ln -s "$CRM/node_modules" "$T/stage/node_modules"
cp "$HERE"/test/test.mjs "$HERE"/test/child.mjs "$T/stage/"
cd "$T/stage" && NODE_ENV=test TEST_MONGO_URI="mongodb://127.0.0.1:$PORT/iconic_sync_test" timeout 300 node test.mjs
