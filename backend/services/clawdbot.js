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
  const { gateway_url, gateway_token } = config.clawdbot;
  
  try {
    const response = await fetch(`${gateway_url}/api/logs?limit=${limit}`, {
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
    throw new Error(`Не вдалося отримати логи: ${err.message}`);
  }
}

module.exports = {
  getStatus,
  getSessions,
  getLogs,
  formatStatus,
  formatUptime
};
