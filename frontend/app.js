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
      if (sessionInfo) sessionInfo.textContent = `${session.percent || 0}%`;
      if (sessionProgress) {
        sessionProgress.style.width = `${session.percent || 0}%`;
        updateProgressColor(sessionProgress, session.percent || 0);
      }
      if (sessionReset) {
        const resetText = session.resetsIn || session.timeUntilReset || '-';
        sessionReset.textContent = `⏱ ${resetText}`;
      }
      
      // Daily
      const dailyInfo = document.getElementById('daily-info');
      const dailyProgress = document.getElementById('daily-progress');
      const dailyReset = document.getElementById('daily-reset');
      if (dailyInfo) dailyInfo.textContent = `${daily.percent || 0}%`;
      if (dailyProgress) {
        dailyProgress.style.width = `${daily.percent || 0}%`;
        updateProgressColor(dailyProgress, daily.percent || 0);
      }
      if (dailyReset) {
        const resetText = daily.resetsIn || daily.timeUntilReset || '-';
        dailyReset.textContent = `⏱ ${resetText}`;
      }
      
      // Weekly
      const weeklyInfo = document.getElementById('weekly-info');
      const weeklyProgress = document.getElementById('weekly-progress');
      const weeklyReset = document.getElementById('weekly-reset');
      if (weeklyInfo) weeklyInfo.textContent = `${weekly.percent || 0}%`;
      if (weeklyProgress) {
        weeklyProgress.style.width = `${weekly.percent || 0}%`;
        updateProgressColor(weeklyProgress, weekly.percent || 0);
      }
      if (weeklyReset) {
        const resetText = weekly.resetsIn || weekly.timeUntilReset || '-';
        weeklyReset.textContent = `⏱ ${resetText}`;
      }
      
      // Monthly
      const monthlyInfo = document.getElementById('monthly-info');
      const monthlyProgress = document.getElementById('monthly-progress');
      const monthlyReset = document.getElementById('monthly-reset');
      if (monthlyInfo) monthlyInfo.textContent = `${monthly.percent || 0}%`;
      if (monthlyProgress) {
        monthlyProgress.style.width = `${monthly.percent || 0}%`;
        updateProgressColor(monthlyProgress, monthly.percent || 0);
      }
      if (monthlyReset) {
        const resetText = monthly.resetsIn || monthly.timeUntilReset || '-';
        monthlyReset.textContent = `⏱ ${resetText}`;
      }
      
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

// Note: Claude usage auto-refreshes every 60 seconds

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

// Current parser for logs
let currentLogParser = 'whales';

async function updateLogs(parserId = currentLogParser) {
  if (!logsContainer) return;
  
  try {
    const data = await fetchAPI(`/parser/${parserId}/logs?lines=15`);
    if (data.success && data.logs && data.logs.length > 0) {
      // Reverse: newest first
      const reversed = [...data.logs].reverse();
      logsContainer.innerHTML = reversed.map(line => {
        const level = line.includes('❌') || line.includes('error') ? 'error' : 
                      line.includes('⚠️') || line.includes('warn') ? 'warn' : 'info';
        return `<div class="log-entry ${level}">${line}</div>`;
      }).join('');
    } else {
      logsContainer.innerHTML = '<div class="log-entry">Немає логів</div>';
    }
  } catch (err) {
    logsContainer.innerHTML = '<div class="log-entry error">Помилка завантаження логів</div>';
  }
}

// Log tabs
document.querySelectorAll('.log-tab').forEach(tab => {
  tab.addEventListener('click', (e) => {
    document.querySelectorAll('.log-tab').forEach(t => {
      t.classList.remove('active');
      t.style.background = 'var(--card-bg)';
      t.style.color = 'var(--text-primary)';
    });
    e.target.classList.add('active');
    e.target.style.background = 'var(--accent)';
    e.target.style.color = 'white';
    
    currentLogParser = e.target.dataset.parser;
    updateLogs(currentLogParser);
  });
});

// Parsers
async function updateParsers() {
  try {
    const data = await fetchAPI('/parser/status');
    
    if (data.success && data.parsers) {
      for (const [parserId, parser] of Object.entries(data.parsers)) {
        const statusEl = document.getElementById(`${parserId}-status`);
        const toggleEl = document.getElementById(`${parserId}-toggle`);
        
        if (statusEl) {
          statusEl.textContent = parser.running ? '🟢' : '⚪';
        }
        
        if (toggleEl) {
          toggleEl.checked = parser.running;
          toggleEl.disabled = false;
        }
      }
    }
  } catch (err) {
    console.error('Parsers status error:', err);
  }
}

// Add event listeners to all parser toggles
document.querySelectorAll('.parser-toggle').forEach(toggle => {
  toggle.addEventListener('change', async (e) => {
    const parserId = e.target.id.replace('-toggle', '');
    const statusEl = document.getElementById(`${parserId}-status`);
    
    e.target.disabled = true;
    if (statusEl) statusEl.textContent = '⏳';
    
    const result = await postAPI(`/parser/${parserId}/toggle`);
    
    if (result.success) {
      await updateParsers();
    } else {
      alert(`Помилка: ${result.error || 'Невідома помилка'}`);
      e.target.checked = !e.target.checked;
    }
    
    e.target.disabled = false;
  });
});

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

// Refresh usage button - reload from file
const refreshUsageBtn = document.getElementById('refresh-usage-btn');
if (refreshUsageBtn) {
  refreshUsageBtn.addEventListener('click', async () => {
    refreshUsageBtn.disabled = true;
    refreshUsageBtn.textContent = '⏳';
    
    await updateClaudeUsage();
    
    refreshUsageBtn.textContent = '✅';
    setTimeout(() => { 
      refreshUsageBtn.textContent = '🔄'; 
      refreshUsageBtn.disabled = false;
    }, 1000);
  });
}

// Model selection and restart
const modelSelect = document.getElementById('model-select');
const restartBtn = document.getElementById('restart-sessions-btn');

if (modelSelect) {
  modelSelect.addEventListener('change', async (e) => {
    const model = e.target.value;
    modelSelect.disabled = true;
    
    try {
      const result = await postAPI(`/bot/model?model=${model}`);
      if (result.success) {
        alert(`✅ Модель змінено на ${model}`);
      } else {
        alert(`❌ Помилка: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Помилка: ${err.message}`);
    }
    
    modelSelect.disabled = false;
  });
}

if (restartBtn) {
  restartBtn.addEventListener('click', async () => {
    if (!confirm('Перезапустити всі сесії?')) return;
    
    restartBtn.disabled = true;
    restartBtn.textContent = '⏳ Перезапуск...';
    
    try {
      const result = await postAPI('/bot/restart');
      if (result.success) {
        alert('✅ Сесії перезапущено!');
      } else {
        alert(`❌ Помилка: ${result.error}`);
      }
    } catch (err) {
      alert(`❌ Помилка: ${err.message}`);
    }
    
    restartBtn.disabled = false;
    restartBtn.textContent = '🔄 Перезапустити сесії';
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
    updateParsers(),
    updateWireGuard(),
    updateLogs()
  ]);
  
  console.log('Init results:', results);
  
  // Auto-refresh system metrics every 3 seconds
  if (updateInterval) clearInterval(updateInterval);
  updateInterval = setInterval(updateSystemMetrics, 3000);
  
  // Refresh WireGuard less frequently
  setInterval(updateWireGuard, 10000);
  
  // Auto-refresh Claude usage every 60 seconds
  setInterval(updateClaudeUsage, 60000);
  
  // Auto-refresh parsers every 10 seconds
  setInterval(updateParsers, 10000);
  
  // Auto-refresh logs every 5 seconds
  setInterval(() => updateLogs(currentLogParser), 5000);
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
