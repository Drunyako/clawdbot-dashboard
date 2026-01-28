/**
 * Parser Service - Telegram Liquidation Forwarder
 * Контролює запуск/зупинку парсера ліквідацій
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Paths
const PARSER_SCRIPT = '/home/ubuntu/clawd/tg_forwarder.py';
const PID_FILE = path.join(__dirname, '..', '..', 'data', 'parser.pid');
const LOG_FILE = path.join(__dirname, '..', '..', 'data', 'parser.log');
const STATUS_FILE = path.join(__dirname, '..', '..', 'data', 'parser.json');

let parserProcess = null;

// Ensure data dir exists
function ensureDataDir() {
  const dataDir = path.dirname(PID_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// Save status to file
function saveStatus(status) {
  ensureDataDir();
  const data = {
    running: status.running,
    pid: status.pid || null,
    startedAt: status.startedAt || null,
    lastActivity: status.lastActivity || new Date().toISOString(),
    messagesForwarded: status.messagesForwarded || 0,
    errors: status.errors || 0
  };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2));
  return data;
}

// Load status from file
function loadStatus() {
  ensureDataDir();
  try {
    if (fs.existsSync(STATUS_FILE)) {
      return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf8'));
    }
  } catch (err) {
    console.error('Error loading parser status:', err);
  }
  return { running: false, pid: null };
}

// Check if process is actually running
function isProcessRunning(pid) {
  if (!pid) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return false;
  }
}

// Get parser status
async function getStatus() {
  const status = loadStatus();
  
  // Verify process is actually running
  if (status.running && status.pid) {
    status.running = isProcessRunning(status.pid);
    if (!status.running) {
      status.pid = null;
      saveStatus(status);
    }
  }
  
  // Also check for orphaned process
  if (!status.running && fs.existsSync(PID_FILE)) {
    const pid = parseInt(fs.readFileSync(PID_FILE, 'utf8').trim());
    if (isProcessRunning(pid)) {
      status.running = true;
      status.pid = pid;
      saveStatus(status);
    }
  }
  
  return status;
}

// Start the parser
async function start() {
  const status = await getStatus();
  
  if (status.running) {
    return { success: false, error: 'Parser вже запущений', status };
  }
  
  ensureDataDir();
  
  // Open log file for appending
  const logStream = fs.openSync(LOG_FILE, 'a');
  
  // Spawn the parser process
  const pythonPath = '/home/ubuntu/clawd/.venv/bin/python';
  parserProcess = spawn(pythonPath, ['-u', PARSER_SCRIPT], {
    cwd: '/home/ubuntu/clawd',
    detached: true,
    stdio: ['ignore', logStream, logStream]
  });
  
  // Save PID
  fs.writeFileSync(PID_FILE, parserProcess.pid.toString());
  
  // Detach so it runs independently
  parserProcess.unref();
  
  const newStatus = saveStatus({
    running: true,
    pid: parserProcess.pid,
    startedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString()
  });
  
  console.log(`Parser started with PID ${parserProcess.pid}`);
  
  return { success: true, message: 'Parser запущено', status: newStatus };
}

// Stop the parser
async function stop() {
  const status = await getStatus();
  
  if (!status.running) {
    return { success: false, error: 'Parser не запущений', status };
  }
  
  try {
    // Kill the process
    process.kill(status.pid, 'SIGTERM');
    
    // Wait a bit and check if it stopped
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (isProcessRunning(status.pid)) {
      // Force kill
      process.kill(status.pid, 'SIGKILL');
    }
    
    // Clean up
    if (fs.existsSync(PID_FILE)) {
      fs.unlinkSync(PID_FILE);
    }
    
    const newStatus = saveStatus({
      running: false,
      pid: null
    });
    
    console.log('Parser stopped');
    
    return { success: true, message: 'Parser зупинено', status: newStatus };
  } catch (err) {
    console.error('Error stopping parser:', err);
    return { success: false, error: err.message, status };
  }
}

// Toggle parser
async function toggle() {
  const status = await getStatus();
  if (status.running) {
    return await stop();
  } else {
    return await start();
  }
}

// Get recent logs
async function getLogs(lines = 50) {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      const allLines = content.split('\n').filter(l => l.trim());
      return allLines.slice(-lines);
    }
  } catch (err) {
    console.error('Error reading logs:', err);
  }
  return [];
}

module.exports = {
  getStatus,
  start,
  stop,
  toggle,
  getLogs
};
