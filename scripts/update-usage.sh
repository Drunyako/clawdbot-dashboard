#!/bin/bash
# Update Claude usage from Clawdbot status

DASHBOARD_DIR="/home/ubuntu/clawdbot-dashboard"
USAGE_FILE="$DASHBOARD_DIR/data/usage.json"

# Get status from Clawdbot
STATUS=$(clawdbot status 2>/dev/null)

if [ -z "$STATUS" ]; then
  echo "Failed to get Clawdbot status"
  exit 1
fi

# Parse usage line: "📊 Usage: 5h 34% left ⏱3h 43m · Week 14% left ⏱5d 1h"
USAGE_LINE=$(echo "$STATUS" | grep -E "Usage:|usage:" || echo "")

if [ -z "$USAGE_LINE" ]; then
  echo "No usage info found"
  exit 1
fi

# Extract session percent (100 - left%)
SESSION_LEFT=$(echo "$USAGE_LINE" | grep -oP '\d+(?=% left)' | head -1)
SESSION_USED=$((100 - ${SESSION_LEFT:-0}))

# Extract session reset time
SESSION_RESET=$(echo "$USAGE_LINE" | grep -oP '⏱[^\s·]+' | head -1 | sed 's/⏱//')

# Extract week percent
WEEK_LEFT=$(echo "$USAGE_LINE" | grep -oP 'Week \K\d+(?=% left)')
WEEK_USED=$((100 - ${WEEK_LEFT:-0}))

# Extract week reset time
WEEK_RESET=$(echo "$USAGE_LINE" | grep -oP 'Week.*⏱\K[^\s]+')

# Get current timestamp
NOW=$(date -u +"%Y-%m-%dT%H:%M:%S.000Z")

# Format reset times for Ukrainian
format_reset() {
  echo "$1" | sed 's/h/г /g; s/m/хв/g; s/d/д /g; s/  */ /g'
}

SESSION_RESET_UA=$(format_reset "$SESSION_RESET")
WEEK_RESET_UA=$(format_reset "$WEEK_RESET")

# Write JSON
cat > "$USAGE_FILE" << EOF
{
  "session": {
    "used": $SESSION_USED,
    "limit": 100,
    "percent": $SESSION_USED,
    "resetsIn": "${SESSION_RESET_UA:-"-"}"
  },
  "daily": {
    "used": $SESSION_USED,
    "limit": 100,
    "percent": $SESSION_USED,
    "resetsIn": "-"
  },
  "weekly": {
    "used": $WEEK_USED,
    "limit": 100,
    "percent": $WEEK_USED,
    "resetsIn": "${WEEK_RESET_UA:-"-"}"
  },
  "monthly": {
    "used": 25,
    "limit": 100,
    "percent": 25,
    "resetsIn": "-"
  },
  "lastUpdated": "$NOW",
  "source": "clawdbot"
}
EOF

echo "Updated usage: Session ${SESSION_USED}%, Week ${WEEK_USED}%"
