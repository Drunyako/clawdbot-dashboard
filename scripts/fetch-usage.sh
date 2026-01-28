#!/bin/bash
# Fetch Anthropic rate limits and update dashboard data
# Requires: ANTHROPIC_API_KEY environment variable

set -e

DATA_DIR="/home/ubuntu/clawdbot-dashboard/data"
OUTPUT_FILE="$DATA_DIR/usage.json"

# Check for API key
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Error: ANTHROPIC_API_KEY not set"
    exit 1
fi

# Make minimal API request to get rate limit headers
# Using max_tokens=1 to minimize token usage
RESPONSE=$(curl -sS -D - -o /dev/null \
    https://api.anthropic.com/v1/messages \
    -H "Content-Type: application/json" \
    -H "x-api-key: $ANTHROPIC_API_KEY" \
    -H "anthropic-version: 2023-06-01" \
    -d '{
        "model": "claude-sonnet-4-20250514",
        "max_tokens": 1,
        "messages": [{"role": "user", "content": "hi"}]
    }' 2>&1)

# Parse rate limit headers
TOKENS_REMAINING=$(echo "$RESPONSE" | grep -i "anthropic-ratelimit-tokens-remaining" | cut -d: -f2 | tr -d ' \r')
TOKENS_LIMIT=$(echo "$RESPONSE" | grep -i "anthropic-ratelimit-tokens-limit" | cut -d: -f2 | tr -d ' \r')
TOKENS_RESET=$(echo "$RESPONSE" | grep -i "anthropic-ratelimit-tokens-reset" | cut -d: -f2- | tr -d ' \r')

REQUESTS_REMAINING=$(echo "$RESPONSE" | grep -i "anthropic-ratelimit-requests-remaining" | cut -d: -f2 | tr -d ' \r')
REQUESTS_LIMIT=$(echo "$RESPONSE" | grep -i "anthropic-ratelimit-requests-limit" | cut -d: -f2 | tr -d ' \r')
REQUESTS_RESET=$(echo "$RESPONSE" | grep -i "anthropic-ratelimit-requests-reset" | cut -d: -f2- | tr -d ' \r')

# Calculate percentages
if [ -n "$TOKENS_LIMIT" ] && [ "$TOKENS_LIMIT" -gt 0 ]; then
    TOKENS_USED=$((TOKENS_LIMIT - TOKENS_REMAINING))
    TOKENS_PERCENT=$((TOKENS_USED * 100 / TOKENS_LIMIT))
else
    TOKENS_USED=0
    TOKENS_PERCENT=0
    TOKENS_LIMIT=0
fi

if [ -n "$REQUESTS_LIMIT" ] && [ "$REQUESTS_LIMIT" -gt 0 ]; then
    REQUESTS_USED=$((REQUESTS_LIMIT - REQUESTS_REMAINING))
    REQUESTS_PERCENT=$((REQUESTS_USED * 100 / REQUESTS_LIMIT))
else
    REQUESTS_USED=0
    REQUESTS_PERCENT=0
    REQUESTS_LIMIT=0
fi

# Calculate time until reset
calc_reset_time() {
    local reset_time="$1"
    if [ -n "$reset_time" ]; then
        local reset_epoch=$(date -d "$reset_time" +%s 2>/dev/null || echo 0)
        local now_epoch=$(date +%s)
        local diff=$((reset_epoch - now_epoch))
        if [ $diff -gt 0 ]; then
            local hours=$((diff / 3600))
            local mins=$(((diff % 3600) / 60))
            echo "${hours}г ${mins}хв"
        else
            echo "зараз"
        fi
    else
        echo "-"
    fi
}

TOKENS_RESET_IN=$(calc_reset_time "$TOKENS_RESET")
REQUESTS_RESET_IN=$(calc_reset_time "$REQUESTS_RESET")

# Create JSON output
mkdir -p "$DATA_DIR"
cat > "$OUTPUT_FILE" << EOF
{
  "tokens": {
    "used": $TOKENS_USED,
    "limit": ${TOKENS_LIMIT:-0},
    "remaining": ${TOKENS_REMAINING:-0},
    "percent": $TOKENS_PERCENT,
    "resetsIn": "$TOKENS_RESET_IN",
    "resetsAt": "$TOKENS_RESET"
  },
  "requests": {
    "used": $REQUESTS_USED,
    "limit": ${REQUESTS_LIMIT:-0},
    "remaining": ${REQUESTS_REMAINING:-0},
    "percent": $REQUESTS_PERCENT,
    "resetsIn": "$REQUESTS_RESET_IN",
    "resetsAt": "$REQUESTS_RESET"
  },
  "lastUpdated": "$(date -Iseconds)",
  "source": "anthropic-api"
}
EOF

echo "Updated $OUTPUT_FILE"
cat "$OUTPUT_FILE"
