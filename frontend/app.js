// Telegram WebApp integration
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  
  // Apply Telegram theme
  if (tg.colorScheme === 'light') {
    document.body.classList.add('tg-theme-light');
  }
}

// State
let updateInterval = null;

// DOM Elements
const connectionStatus = document.getElementById('connection-status');
const modelEl = document.getElementById('model');
const uptimeEl = document.getElementById('uptime');
const sessionsEl = document.getElementById('sessions');
const tokensEl = document.getElementById('tokens');
const cpuValue = document.getElementById('cpu-value');
const cpuProgress = document.getElementById('cpu-progress');
const ramValue = document.getElementById('ram-value');
const ramProgress = document.getElementById('ram-progress');
const diskValue = document.getElementById('disk-value');
const diskProgress = document.getElementById('disk-progress');
const wgStatus = document.getElementById('wg-status');
const wgToggle = document.getElementById('wg-toggle');
const wgPeers = document.getElementById('wg-peers');
const logsContainer = document.getElementById('logs-container');

// API helpers
async function fetchAPI(endpoint) {
  try {
    const response = await fetch(`/api${endpoint}`);
    const data = await response.json();
    console.log(`API ${endpoint}:`, data);
    return data;
  } catch (err) {
    console.error(`API Error: ${endpoint}`, err);
    return { success: false, error: err.message };
  }
}

async function postAPI(endpoint) {
  try {
    const response = await fetch(`/api${endpoint}`, { method: 'POST' });
    return await response.json();
  } catch (err) {
    console.error(`API Error: ${endpoint}`, err);
    return { success: false, error: err.message };
  }
}

// Format helpers
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

function updateProgressColor(element, value) {
  element.classList.remove('warning', 'danger');
  if (value > 90) {
    element.classList.add('danger');
  } else if (value > 70) {
    element.classList.add('warning');
  }
}

// Update functions
async function updateSystemMetrics() {
  try {
    const data = await fetchAPI('/system');
    
    if (data.success && data.metrics) {
      const { cpu, memory, disk, uptime } = data.metrics;
      
      // CPU
      if (cpuValue && cpuProgress) {
        cpuValue.textContent = `${cpu.usage}%`;
        cpuProgress.style.width = `${Math.min(cpu.usage, 100)}%`;
        updateProgressColor(cpuProgress, cpu.usage);
      }
      
      // RAM
      if (ramValue && ramProgress) {
        ramValue.textContent = `${memory.usagePercent}% (${memory.used})`;
        ramProgress.style.width = `${Math.min(memory.usagePercent, 100)}%`;
        updateProgressColor(ramProgress, memory.usagePercent);
      }
      
      // Disk (first mount)
      if (diskValue && diskProgress && disk && disk.length > 0) {
        const mainDisk = disk.find(d => d.mount === '/') || disk[0];
        diskValue.textContent = `${mainDisk.usagePercent}% (${mainDisk.used})`;
        diskProgress.style.width = `${Math.min(mainDisk.usagePercent, 100)}%`;
        updateProgressColor(diskProgress, mainDisk.usagePercent);
      }
      
      // Server uptime
      if (uptimeEl && uptime) {
        uptimeEl.textContent = formatUptime(uptime);
      }
      
      // Update connection status
      if (connectionStatus) {
        connectionStatus.classList.add('connected');
        connectionStatus.classList.remove('error');
      }
      
      return true;
    }
  } catch (err) {
    console.error('Failed to update system metrics:', err);
  }
  
  if (connectionStatus) {
    connectionStatus.classList.remove('connected');
    connectionStatus.classList.add('error');
  }
  return false;
}

async function updateBotStatus() {
  // For now, just show placeholder - will connect to Clawdbot later
  if (modelEl) modelEl.textContent = 'Claude Opus 4.5';
  if (sessionsEl) sessionsEl.textContent = '-';
}

async function updateClaudeUsage() {
  try {
    const data = await fetchAPI('/claude/usage');
    
    if (data.success && data.usage) {
      const { session, daily, weekly, monthly, lastUpdated } = data.usage;
      
      // Session
      const sessionInfo = document.getElementById('session-info');
      const sessionProgress = document.getElementById('session-progress');
      const sessionReset = document.getElementById('session-reset');
      if (sessionInfo) sessionInfo.textContent = `${session.percent}% (${session.used}/${session.limit})`;
      if (sessionProgress) {
        sessionProgress.style.width = `${session.percent}%`;
        updateProgressColor(sessionProgress, session.percent);
      }
      if (sessionReset) sessionReset.textContent = `Скидається через ${session.timeUntilReset}`;
      
      // Daily
      const dailyInfo = document.getElementById('daily-info');
      const dailyProgress = document.getElementById('daily-progress');
      const dailyReset = document.getElementById('daily-reset');
      if (dailyInfo) dailyInfo.textContent = `${daily.percent}% (${daily.used}/${daily.limit})`;
      if (dailyProgress) {
        dailyProgress.style.width = `${daily.percent}%`;
        updateProgressColor(dailyProgress, daily.percent);
      }
      if (dailyReset) dailyReset.textContent = `Скидається через ${daily.timeUntilReset}`;
      
      // Weekly
      const weeklyInfo = document.getElementById('weekly-info');
      const weeklyProgress = document.getElementById('weekly-progress');
      const weeklyReset = document.getElementById('weekly-reset');
      if (weeklyInfo) weeklyInfo.textContent = `${weekly.percent}% (${weekly.used}/${weekly.limit})`;
      if (weeklyProgress) {
        weeklyProgress.style.width = `${weekly.percent}%`;
        updateProgressColor(weeklyProgress, weekly.percent);
      }
      if (weeklyReset) weeklyReset.textContent = `Скидається через ${weekly.timeUntilReset}`;
      
      // Monthly
      const monthlyInfo = document.getElementById('monthly-info');
      const monthlyProgress = document.getElementById('monthly-progress');
      const monthlyReset = document.getElementById('monthly-reset');
      if (monthlyInfo) monthlyInfo.textContent = `${monthly.percent}% (${monthly.used}/${monthly.limit})`;
      if (monthlyProgress) {
        monthlyProgress.style.width = `${monthly.percent}%`;
        updateProgressColor(monthlyProgress, monthly.percent);
      }
      if (monthlyReset) monthlyReset.textContent = `Скидається через ${monthly.timeUntilReset}`;
      
      // Last updated
      const usageUpdated = document.getElementById('usage-updated');
      if (usageUpdated && lastUpdated) {
        const date = new Date(lastUpdated);
        usageUpdated.textContent = `Оновлено: ${date.toLocaleTimeString('uk')}`;
      }
    }
  } catch (err) {
    console.error('Claude usage error:', err);
  }
}

// Sync usage button handler
const syncUsageBtn = document.getElementById('sync-usage-btn');
if (syncUsageBtn) {
  syncUsageBtn.addEventListener('click', async () => {
    syncUsageBtn.disabled = true;
    syncUsageBtn.textContent = '⏳';
    
    // For now, just prompt for manual input
    const sessionPercent = prompt('Введи % використання сесії (напр. 76):');
    const weeklyPercent = prompt('Введи % використання за тиждень (напр. 76):');
    
    if (sessionPercent !== null && weeklyPercent !== null) {
      await postAPI('/claude/usage', {
        session: parseInt(sessionPercent) || 0,
        sessionLimit: 100,
        weekly: parseInt(weeklyPercent) || 0,
        weeklyLimit: 100
      });
      await updateClaudeUsage();
    }
    
    syncUsageBtn.disabled = false;
    syncUsageBtn.textContent = '🔄 Синхронізувати';
  });
}

async function updateWireGuard() {
  try {
    const data = await fetchAPI('/wireguard');
    
    if (wgStatus) {
      if (data.success) {
        wgToggle.checked = data.active;
        wgStatus.textContent = data.active ? '🟢 Активний' : '⚪ Вимкнений';
        wgToggle.disabled = false;
        
        // Show peers
        if (wgPeers && data.peers && data.peers.length > 0) {
          wgPeers.innerHTML = data.peers.map(peer => `
            <div class="peer">
              <strong>Peer:</strong> ${peer.publicKey?.substring(0, 12)}...<br>
              ${peer.endpoint ? `<small>Endpoint: ${peer.endpoint}</small>` : ''}
            </div>
          `).join('');
        } else if (wgPeers) {
          wgPeers.innerHTML = '<small>Немає підключених пірів</small>';
        }
      } else {
        wgStatus.textContent = '❌ Недоступний';
        wgToggle.disabled = true;
      }
    }
  } catch (err) {
    console.error('WireGuard error:', err);
    if (wgStatus) wgStatus.textContent = '❌ Помилка';
    if (wgToggle) wgToggle.disabled = true;
  }
}

async function updateLogs() {
  if (!logsContainer) return;
  
  try {
    const data = await fetchAPI('/status/logs?limit=10');
    if (data.success && data.logs && data.logs.length > 0) {
      logsContainer.innerHTML = data.logs.map(log => `
        <div class="log-entry ${log.level || ''}">${log.timestamp || ''} ${log.message || log}</div>
      `).join('');
    } else {
      logsContainer.innerHTML = '<div class="log-entry">Логи недоступні</div>';
    }
  } catch (err) {
    logsContainer.innerHTML = '<div class="log-entry error">Помилка завантаження логів</div>';
  }
}

// Event handlers
if (wgToggle) {
  wgToggle.addEventListener('change', async () => {
    wgToggle.disabled = true;
    wgStatus.textContent = '⏳ Перемикаю...';
    
    const result = await postAPI('/wireguard/toggle');
    
    if (result.success) {
      await updateWireGuard();
    } else {
      alert(`Помилка: ${result.error || 'Невідома помилка'}`);
      wgToggle.checked = !wgToggle.checked;
      wgToggle.disabled = false;
    }
  });
}

// Initialize
async function init() {
  console.log('🚀 Initializing dashboard...');
  
  // Show loading state
  if (connectionStatus) connectionStatus.textContent = '⏳';
  
  // Load all data
  const results = await Promise.allSettled([
    updateSystemMetrics(),
    updateBotStatus(),
    updateClaudeUsage(),
    updateWireGuard(),
    updateLogs()
  ]);
  
  console.log('Init results:', results);
  
  // Auto-refresh system metrics every 3 seconds
  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(updateSystemMetrics, 3000);
  
  // Refresh WireGuard less frequently
  setInterval(updateWireGuard, 10000);
}

// Start when DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Cleanup on page hide
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (updateInterval) clearInterval(updateInterval);
  } else {
    init();
  }
});

console.log('📊 Dashboard script loaded');
