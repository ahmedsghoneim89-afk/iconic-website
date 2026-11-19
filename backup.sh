#!/bin/sh
# Daily backup: a consistent copy of the database plus every uploaded image and CV file, in ./backups
# Cron example (every night at 03:30):  30 3 * * * cd /opt/iconic && ./backup.sh
set -e
mkdir -p backups
docker compose exec -T app node server/cli.js backup /app/data/backups/iconic.db >/dev/null
docker run --rm -v iconic_data:/data -v "$(pwd)/backups":/out alpine \
  sh -c "cd /data && tar czf /out/iconic-$(date +%F).tgz backups uploads \$([ -d cv ] && echo cv)"
find backups -name 'iconic-*.tgz' -mtime +30 -delete
echo "Backup written to backups/iconic-$(date +%F).tgz"
