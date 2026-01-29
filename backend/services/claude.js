/**
 * Claude Usage Service
 * Отримання статистики використання Claude через Clawdbot
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

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
    session: { used: 0, limit: 100, resetsIn: '-', percent: 0 },
    daily: { used: 0, limit: 100, resetsIn: '-', percent: 0 },
    weekly: { used: 0, limit: 100, resetsIn: '-', percent: 0 },
    monthly: { used: 0, limit: 100, resetsIn: '-', percent: 0 },
    lastUpdated: new Date().toISOString(),
    source: 'none'
  };
}

// Parse Clawdbot session status output
function parseClawdbotStatus(output) {
  const usage = getDefaultUsage();
  
  // Parse "5h 18% left ⏱3h 45m" format
  // Session: look for pattern like "5h 18% left ⏱3h 45m"
  const sessionMatch = output.match(/(\d+)h?\s*(\d+)%\s*left\s*⏱\s*([^\n·]+)/i);
  if (sessionMatch) {
    const percentLeft = parseInt(sessionMatch[2]);
    usage.session.percent = 100 - percentLeft;
    usage.session.used = usage.session.percent;
    usage.session.resetsIn = sessionMatch[3].trim();
  }
  
  // Weekly: look for "Week 23% left ⏱5d 8h"
  const weekMatch = output.match(/Week\s*(\d+)%\s*left\s*⏱\s*([^\n]+)/i);
  if (weekMatch) {
    const percentLeft = parseInt(weekMatch[1]);
    usage.weekly.percent = 100 - percentLeft;
    usage.weekly.used = usage.weekly.percent;
    usage.weekly.resetsIn = weekMatch[2].trim();
  }
  
  usage.lastUpdated = new Date().toISOString();
  usage.source = 'clawdbot';
  
  return usage;
}

// Fetch usage from Clawdbot gateway
async function fetchFromClawdbot() {
  try {
    // Try to get status from Clawdbot's internal API
    const response = await fetch('http://127.0.0.1:18789/api/sessions?limit=1', {
      headers: { 'Accept': 'application/json' },
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      // Parse the response if available
      console.log('Clawdbot sessions:', JSON.stringify(data).substring(0, 200));
    }
  } catch (err) {
    console.log('Could not fetch from Clawdbot API:', err.message);
  }
  
  return null;
}

// Load usage from file
function loadUsage() {
  ensureDataDir();
  try {
    if (fs.existsSync(USAGE_FILE)) {
      return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
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
  let usage = loadUsage();
  
  // Check if data is stale (older than 5 minutes)
  const lastUpdate = new Date(usage.lastUpdated || 0);
  const now = new Date();
  const ageMinutes = (now - lastUpdate) / (1000 * 60);
  
  if (ageMinutes > 5 || usage.source === 'none') {
    // Try to fetch fresh data
    await fetchFromClawdbot();
  }
  
  return usage;
}

// Update usage from external source (Clawdbot bot can call this)
async function updateFromClawdbot(statusText) {
  const usage = parseClawdbotStatus(statusText);
  saveUsage(usage);
  return usage;
}

// Set usage manually
async function setUsage(data) {
  const usage = loadUsage();
  
  if (data.session !== undefined) {
    usage.session.percent = data.session;
    usage.session.used = data.session;
  }
  if (data.sessionResetsIn) {
    usage.session.resetsIn = data.sessionResetsIn;
  }
  if (data.weekly !== undefined) {
    usage.weekly.percent = data.weekly;
    usage.weekly.used = data.weekly;
  }
  if (data.weeklyResetsIn) {
    usage.weekly.resetsIn = data.weeklyResetsIn;
  }
  if (data.daily !== undefined) {
    usage.daily.percent = data.daily;
    usage.daily.used = data.daily;
  }
  if (data.monthly !== undefined) {
    usage.monthly.percent = data.monthly;
    usage.monthly.used = data.monthly;
  }
  
  usage.source = 'manual';
  saveUsage(usage);
  return usage;
}

// Add tokens used
async function addUsage(tokens) {
  const usage = loadUsage();
  usage.session.used += tokens;
  usage.session.percent = Math.min(100, usage.session.used);
  usage.daily.used += tokens;
  usage.daily.percent = Math.min(100, usage.daily.used);
  usage.weekly.used += tokens;
  usage.weekly.percent = Math.min(100, usage.weekly.used);
  usage.monthly.used += tokens;
  usage.monthly.percent = Math.min(100, usage.monthly.used);
  saveUsage(usage);
  return usage;
}

// Refresh usage - just reload from file
async function refreshFromAPI() {
  return loadUsage();
}

module.exports = {
  getUsage,
  setUsage,
  addUsage,
  updateFromClawdbot,
  parseClawdbotStatus,
  refreshFromAPI
};
