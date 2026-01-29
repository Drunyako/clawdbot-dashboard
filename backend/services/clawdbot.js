/**
 * Clawdbot Gateway Service
 * Взаємодія з Clawdbot Gateway API
 */

async function getStatus(config) {
  const { gateway_url, gateway_token } = config.clawdbot;
  
  try {
    const response = await fetch(`${gateway_url}/api/status`, {
      headers: {
        'Authorization': `Bearer ${gateway_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}`);
    }
    
    const data = await response.json();
    return formatStatus(data);
  } catch (err) {
    throw new Error(`Не вдалося з'єднатися з Gateway: ${err.message}`);
  }
}

function formatStatus(data) {
  const lines = [];
  
  if (data.uptime) {
    lines.push(`⏱ Uptime: ${formatUptime(data.uptime)}`);
  }
  if (data.sessions) {
    lines.push(`📱 Сесій: ${data.sessions.active || 0} активних`);
  }
  if (data.model) {
    lines.push(`🧠 Модель: ${data.model}`);
  }
  if (data.tokens) {
    lines.push(`🪙 Токени: ${data.tokens.used || 0} / ${data.tokens.limit || '∞'}`);
  }
  
  return lines.join('\n') || 'Статус отримано';
}

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  const parts = [];
  if (days > 0) parts.push(`${days}д`);
  if (hours > 0) parts.push(`${hours}г`);
  if (minutes > 0) parts.push(`${minutes}хв`);
  
  return parts.join(' ') || '< 1 хв';
}

async function getSessions(config) {
  const { gateway_url, gateway_token } = config.clawdbot;
  
  try {
    const response = await fetch(`${gateway_url}/api/sessions`, {
      headers: {
        'Authorization': `Bearer ${gateway_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Gateway returned ${response.status}`);
    }
    
    return await response.json();
  } catch (err) {
    throw new Error(`Не вдалося отримати сесії: ${err.message}`);
  }
}

async function getLogs(config, limit = 50) {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  try {
    // Read from PM2 logs or journalctl
    const { stdout } = await execAsync(`pm2 logs clawdbot --nostream --lines ${limit} 2>/dev/null || journalctl -u clawdbot -n ${limit} --no-pager -o short 2>/dev/null || echo "Логи недоступні"`);
    
    const lines = stdout.split('\n').filter(l => l.trim());
    return lines.map(line => ({
      message: line,
      level: line.includes('error') || line.includes('❌') ? 'error' : 
             line.includes('warn') || line.includes('⚠️') ? 'warn' : 'info'
    }));
  } catch (err) {
    return [{ message: `Помилка: ${err.message}`, level: 'error' }];
  }
}

module.exports = {
  getStatus,
  getSessions,
  getLogs,
  formatStatus,
  formatUptime
};
