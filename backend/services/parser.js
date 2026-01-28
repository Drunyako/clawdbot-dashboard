/**
 * Parser Service - Controls systemd services for Telegram Forwarders
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

// Parser configurations (matching systemd service names)
const PARSERS = {
  liquidations: {
    name: 'Ліквідації',
    service: 'parser-liquidations',
    source: 'BinanceLiquidations',
    dest: '@deepseek_com',
    icon: '📊'
  },
  whales: {
    name: 'Whale Alert',
    service: 'parser-whales',
    source: 'whale_alert_io',
    dest: '@ai_devin',
    icon: '🐋'
  }
};

// Get parser status via systemctl
async function getStatus(parserId) {
  if (!PARSERS[parserId]) {
    throw new Error(`Unknown parser: ${parserId}`);
  }
  
  const config = PARSERS[parserId];
  
  try {
    const { stdout } = await execAsync(`systemctl is-active ${config.service}.service`);
    const running = stdout.trim() === 'active';
    
    return {
      id: parserId,
      name: config.name,
      source: config.source,
      dest: config.dest,
      icon: config.icon,
      running,
      service: config.service
    };
  } catch (err) {
    // systemctl returns non-zero for inactive services
    return {
      id: parserId,
      name: config.name,
      source: config.source,
      dest: config.dest,
      icon: config.icon,
      running: false,
      service: config.service
    };
  }
}

// Get all parsers status
async function getAllStatus() {
  const result = {};
  for (const parserId of Object.keys(PARSERS)) {
    result[parserId] = await getStatus(parserId);
  }
  return result;
}

// Start a parser via systemctl
async function start(parserId) {
  if (!PARSERS[parserId]) {
    throw new Error(`Unknown parser: ${parserId}`);
  }
  
  const config = PARSERS[parserId];
  
  try {
    await execAsync(`sudo systemctl start ${config.service}.service`);
    const status = await getStatus(parserId);
    
    return { 
      success: true, 
      message: `${config.name} запущено`,
      status
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Stop a parser via systemctl
async function stop(parserId) {
  if (!PARSERS[parserId]) {
    throw new Error(`Unknown parser: ${parserId}`);
  }
  
  const config = PARSERS[parserId];
  
  try {
    await execAsync(`sudo systemctl stop ${config.service}.service`);
    const status = await getStatus(parserId);
    
    return { 
      success: true, 
      message: `${config.name} зупинено`,
      status
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Toggle parser
async function toggle(parserId) {
  const status = await getStatus(parserId);
  if (status.running) {
    return await stop(parserId);
  } else {
    return await start(parserId);
  }
}

// Get logs for a parser via journalctl
async function getLogs(parserId, lines = 50) {
  if (!PARSERS[parserId]) {
    throw new Error(`Unknown parser: ${parserId}`);
  }
  
  const config = PARSERS[parserId];
  
  try {
    const { stdout } = await execAsync(`sudo journalctl -u ${config.service}.service -n ${lines} --no-pager -o short`);
    return stdout.split('\n').filter(l => l.trim());
  } catch (err) {
    console.error(`Error reading ${parserId} logs:`, err);
    return [];
  }
}

// Get list of available parsers
function getAvailableParsers() {
  return Object.entries(PARSERS).map(([id, config]) => ({
    id,
    ...config
  }));
}

module.exports = {
  getStatus,
  getAllStatus,
  start,
  stop,
  toggle,
  getLogs,
  getAvailableParsers,
  PARSERS
};
