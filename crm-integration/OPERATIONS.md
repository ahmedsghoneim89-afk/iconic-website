# ICONIC CRM catalog link: operations

The CRM (crm.iconicrealestateegy.com) is the source of truth for developers, projects, cities and areas.
The website shows them, adds its own content on top, and sends name or relationship edits back to the CRM.

## Who owns what

| Owned by the CRM (website shows the confirmed value) | Owned by the website (never sent to the CRM) |
|---|---|
| Name of developer, project, city, area | Description (AR/EN), logo and pictures, order |
| Project's developer, city and area | SEO title and description (AR/EN) |
| Project active or inactive | Public address (slug), made once and never changed by a rename |
| Stable ID and version of every record | City → website region (Alexandria, North Coast, Cairo, Red Sea) |
| | Unit → project link (`projectId`), unit texts, prices, agents |

Only these CRM fields travel. No customer data, internal notes, lead statistics or contact details.
A unit stores only the project ID. Its developer, area and region are derived from the project when the page is built.
There are no coordinates, geocoding or map data, and no draft/publish state.

## How a change travels

1. CRM write (any CRM path, including bulk updates) → the CRM records an event in a durable outbox (Mongo) and sends it at once.
2. The event is signed (HMAC-SHA256 over `timestamp.body`, five-minute window). The website checks the signature, the event ID (replay), and the record version (older versions are ignored, out of order is safe).
3. The website applies it and its pages update immediately. It never sends events back, so there are no loops.
4. A website admin edit goes the other way: website → CRM restricted endpoint (with the admin's e-mail for the CRM audit log) → CRM confirms with the new version → the website shows only that confirmed value. A stale form gets a conflict message and the admin's entries are kept.

## Retry and recovery

- Outbox rows are claimed with a 30-second lease, retried with exponential backoff up to 300 seconds, and survive a CRM restart.
- A 4xx answer from the website (except 401, 408, 429) marks the event *refused* and it stays visible in the dashboard until someone presses "Send again".
- A CRM-side safety scan runs every 60 seconds; the website runs a full comparison with the CRM every 6 hours (`CRM_SAFETY_RECONCILE_HOURS`) and at start-up. Both are idempotent.
- Deleted or deactivated records disappear from the public site. Units, descriptions and pictures are kept. A unit whose project was deleted falls back to the project text saved on it and is listed under "broken links" in the link report.

## Where to look

- Dashboard → Catalog → Link status: counts, last event, last full check, last problem, delivery queue, "Check again now", "Send again".
- Website log: `docker logs iconic-app-1 --tail 50`
- CRM log: `pm2 logs iconic-crm-server --lines 50 | grep website-sync`
- Link units to projects (dry run, then apply): `docker exec iconic-app-1 node server/cli.js link-units [--apply]`. Only exact, unique name matches are linked. Ambiguous and missing names are listed and left alone.

## Settings (never printed or committed)

- CRM: `/etc/iconic-crm/runtime.env` → `WEBSITE_SYNC_URL`, `WEBSITE_EVENT_SECRET`, `WEBSITE_REQUEST_SECRET`
- Website: `/opt/iconic/.env` → `CRM_SYNC_URL`, `CRM_EVENT_SECRET`, `CRM_REQUEST_SECRET` (the container must be recreated to read them: `docker compose -f docker-compose.yml -f docker-compose.nginx.yml up -d --force-recreate app`)

## Backups taken before the migration (2026-11-19)

- Website database and uploads: `/var/backups/iconic-website-sync/website-before-catalog.tgz` (also `/opt/iconic/backups/iconic-2026-11-19.tgz`)
- CRM files and Mongo collections: `/var/backups/iconic-website-sync/20261119-055252/` (`index.js.orig`, `runtime.env.orig`, `website.env.orig`, `mongo/`, `INFO`)

## Rollback

CRM (additive; it puts the CRM back as it was, and the `websitesync_*` collections are simply unused):

```
/opt/iconic/crm-integration/rollback.sh /var/backups/iconic-website-sync/20261119-055252 --restore-env
```

Website (back to the version before this work):

```
cd /opt/iconic && git checkout 1d0d804
docker compose -f docker-compose.yml -f docker-compose.nginx.yml up -d --build app
```

Rolling back only the CRM side is also safe: the website keeps the last imported catalog and shows it, and edits from the dashboard report that the CRM is unreachable and change nothing.

## Tests

- CRM side, isolated Mongo on the server: `crm-integration/test/run.sh` (124 checks; write-to-event latency median 16 ms, p95 24 ms, max 34 ms).
- The tests refuse any database that is not their own throwaway instance.
