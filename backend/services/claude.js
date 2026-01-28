/**
 * Claude Usage Service
 * Отримання статистики використання Claude
 */

const fs = require('fs');
const path = require('path');

// Usage data file path
const USAGE_FILE = path.join(__dirname, '..', '..', 'data', 'usage.json');

// Ensure data directory exists
function ensureDataDir() {
  const dataDir = path.dirname(USAGE_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Get default usage structure
function getDefaultUsage() {
  return {
    session: {
      used: 0,
      limit: 100,
      resetsAt: getNextReset('session')
    },
    daily: {
      used: 0,
      limit: 100,
      resetsAt: getNextReset('daily')
    },
    weekly: {
      used: 0,
      limit: 100,
      resetsAt: getNextReset('weekly')
    },
    monthly: {
      used: 0,
      limit: 100,
      resetsAt: getNextReset('monthly')
    },
    lastUpdated: new Date().toISOString()
  };
}

// Calculate next reset time
function getNextReset(period) {
  const now = new Date();
  switch (period) {
    case 'session':
      // Session resets every 4 hours
      return new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString();
    case 'daily':
      // Daily resets at midnight UTC
      const tomorrow = new Date(now);
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      tomorrow.setUTCHours(0, 0, 0, 0);
      return tomorrow.toISOString();
    case 'weekly':
      // Weekly resets Monday midnight UTC
      const nextMonday = new Date(now);
      nextMonday.setUTCDate(nextMonday.getUTCDate() + ((8 - nextMonday.getUTCDay()) % 7 || 7));
      nextMonday.setUTCHours(0, 0, 0, 0);
      return nextMonday.toISOString();
    case 'monthly':
      // Monthly resets on 1st
      const nextMonth = new Date(now);
      nextMonth.setUTCMonth(nextMonth.getUTCMonth() + 1);
      nextMonth.setUTCDate(1);
      nextMonth.setUTCHours(0, 0, 0, 0);
      return nextMonth.toISOString();
    default:
      return now.toISOString();
  }
}

// Load usage from file
function loadUsage() {
  ensureDataDir();
  try {
    if (fs.existsSync(USAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
      // Check if resets have passed and reset counters
      const now = new Date();
      
      for (const period of ['session', 'daily', 'weekly', 'monthly']) {
        if (data[period] && new Date(data[period].resetsAt) < now) {
          data[period].used = 0;
          data[period].resetsAt = getNextReset(period);
        }
      }
      
      return data;
    }
  } catch (err) {
    console.error('Error loading usage:', err);
  }
  return getDefaultUsage();
}

// Save usage to file
function saveUsage(usage) {
  ensureDataDir();
  usage.lastUpdated = new Date().toISOString();
  fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
}

// Get current usage
async function getUsage() {
  const usage = loadUsage();
  
  // Calculate percentages
  const result = {
    session: {
      ...usage.session,
      percent: Math.round((usage.session.used / usage.session.limit) * 100),
      remaining: usage.session.limit - usage.session.used,
      timeUntilReset: formatTimeUntil(usage.session.resetsAt)
    },
    daily: {
      ...usage.daily,
      percent: Math.round((usage.daily.used / usage.daily.limit) * 100),
      remaining: usage.daily.limit - usage.daily.used,
      timeUntilReset: formatTimeUntil(usage.daily.resetsAt)
    },
    weekly: {
      ...usage.weekly,
      percent: Math.round((usage.weekly.used / usage.weekly.limit) * 100),
      remaining: usage.weekly.limit - usage.weekly.used,
      timeUntilReset: formatTimeUntil(usage.weekly.resetsAt)
    },
    monthly: {
      ...usage.monthly,
      percent: Math.round((usage.monthly.used / usage.monthly.limit) * 100),
      remaining: usage.monthly.limit - usage.monthly.used,
      timeUntilReset: formatTimeUntil(usage.monthly.resetsAt)
    },
    lastUpdated: usage.lastUpdated
  };
  
  return result;
}

// Update usage (call this when tokens are used)
async function addUsage(tokens) {
  const usage = loadUsage();
  
  usage.session.used += tokens;
  usage.daily.used += tokens;
  usage.weekly.used += tokens;
  usage.monthly.used += tokens;
  
  saveUsage(usage);
  return getUsage();
}

// Set usage manually (for syncing with Claude dashboard)
async function setUsage(data) {
  const usage = loadUsage();
  
  if (data.session !== undefined) {
    usage.session.used = data.session;
    if (data.sessionLimit) usage.session.limit = data.sessionLimit;
  }
  if (data.daily !== undefined) {
    usage.daily.used = data.daily;
    if (data.dailyLimit) usage.daily.limit = data.dailyLimit;
  }
  if (data.weekly !== undefined) {
    usage.weekly.used = data.weekly;
    if (data.weeklyLimit) usage.weekly.limit = data.weeklyLimit;
  }
  if (data.monthly !== undefined) {
    usage.monthly.used = data.monthly;
    if (data.monthlyLimit) usage.monthly.limit = data.monthlyLimit;
  }
  
  saveUsage(usage);
  return getUsage();
}

// Format time until reset
function formatTimeUntil(isoDate) {
  const now = new Date();
  const target = new Date(isoDate);
  const diff = target - now;
  
  if (diff <= 0) return 'зараз';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}д ${hours % 24}г`;
  }
  
  return `${hours}г ${minutes}хв`;
}

module.exports = {
  getUsage,
  addUsage,
  setUsage
};
