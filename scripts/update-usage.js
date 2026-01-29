#!/usr/bin/env node
/**
 * Claude Usage Updater
 * Запитує Anthropic API і оновлює usage.json
 * Запускати через cron кожні 10 хвилин
 */

const fs = require('fs');
const path = require('path');

const USAGE_FILE = path.join(__dirname, '..', 'data', 'usage.json');
const API_KEY = process.env.ANTHROPIC_API_KEY;

async function getUsageFromAPI() {
  let apiKey = API_KEY;
  
  if (!apiKey) {
    // Try to read from clawdbot auth profiles
    const authPath = path.join(process.env.HOME, '.clawdbot', 'agents', 'main', 'agent', 'auth-profiles.json');
    if (fs.existsSync(authPath)) {
      const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
      const defaultProfile = auth.profiles?.['anthropic:default'];
      if (defaultProfile?.token) {
        apiKey = defaultProfile.token;
      }
    }
  }
  
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY not found');
  }

  // Make minimal API call to get rate limit headers
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-3-haiku-20240307',
      max_tokens: 1,
      messages: [{ role: 'user', content: 'hi' }]
    })
  });

  // Parse rate limit headers
  const headers = {};
  response.headers.forEach((value, key) => {
    headers[key.toLowerCase()] = value;
  });

  console.log('Response status:', response.status);
  console.log('Rate limit headers:', JSON.stringify(headers, null, 2));

  // Extract rate limits
  // anthropic-ratelimit-requests-limit
  // anthropic-ratelimit-requests-remaining
  // anthropic-ratelimit-requests-reset
  // anthropic-ratelimit-tokens-limit
  // anthropic-ratelimit-tokens-remaining
  // anthropic-ratelimit-tokens-reset

  const tokensLimit = parseInt(headers['anthropic-ratelimit-tokens-limit'] || '0');
  const tokensRemaining = parseInt(headers['anthropic-ratelimit-tokens-remaining'] || '0');
  const tokensReset = headers['anthropic-ratelimit-tokens-reset'];
  
  const requestsLimit = parseInt(headers['anthropic-ratelimit-requests-limit'] || '0');
  const requestsRemaining = parseInt(headers['anthropic-ratelimit-requests-remaining'] || '0');
  const requestsReset = headers['anthropic-ratelimit-requests-reset'];

  // Calculate percentages
  let sessionPercent = 0;
  let sessionResetsIn = '-';
  
  if (tokensLimit > 0) {
    const tokensUsed = tokensLimit - tokensRemaining;
    sessionPercent = Math.round((tokensUsed / tokensLimit) * 100);
  }
  
  if (tokensReset) {
    const resetDate = new Date(tokensReset);
    const now = new Date();
    const diffMs = resetDate - now;
    if (diffMs > 0) {
      const diffMins = Math.round(diffMs / 60000);
      if (diffMins >= 60) {
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        sessionResetsIn = `${hours}г ${mins}хв`;
      } else {
        sessionResetsIn = `${diffMins}хв`;
      }
    }
  }

  return {
    session: {
      used: sessionPercent,
      limit: 100,
      percent: sessionPercent,
      resetsIn: sessionResetsIn,
      tokensRemaining,
      tokensLimit
    },
    daily: { used: 0, limit: 100, percent: 0, resetsIn: '-' },
    weekly: { used: 0, limit: 100, percent: 0, resetsIn: '-' },
    monthly: { used: 0, limit: 100, percent: 0, resetsIn: '-' },
    lastUpdated: new Date().toISOString(),
    source: 'anthropic-api',
    raw: {
      tokensLimit,
      tokensRemaining,
      tokensReset,
      requestsLimit,
      requestsRemaining,
      requestsReset
    }
  };
}

async function main() {
  console.log(`[${new Date().toISOString()}] Updating Claude usage...`);
  
  try {
    const usage = await getUsageFromAPI();
    
    // Ensure data directory exists
    const dataDir = path.dirname(USAGE_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
    console.log('Usage updated:', JSON.stringify(usage, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
