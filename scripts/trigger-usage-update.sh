#!/bin/bash
# Trigger Clawdbot to update usage.json
# Run via cron every 10 minutes

curl -s -X POST "http://127.0.0.1:18789/api/cron/wake" \
  -H "Content-Type: application/json" \
  -d '{"text":"[auto] Оновити usage.json для dashboard"}' \
  2>/dev/null || true

echo "[$(date)] Usage update triggered"
