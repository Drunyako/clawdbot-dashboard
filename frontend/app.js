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
    return await response.json();
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

// Update functions
async function updateBotStatus() {
  const data = await fetchAPI('/status');
  if (data.success && data.status) {
    // Parse status string or use object
    connectionStatus.classList.add('connected');
  } else {
    connectionStatus.classList.remove('connected');
    connectionStatus.classList.add('error');
  }
}

async function updateSystemMetrics() {
  const data = await fetchAPI('/system');
  if (data.success && data.metrics) {
    const { cpu, memory, disk } = data.metrics;
    
    // CPU
    cpuValue.textContent = `${cpu.usage}%`;
    cpuProgress.style.width = `${cpu.usage}%`;
    updateProgressColor(cpuProgress, cpu.usage);
    
    // RAM
    ramValue.textContent = `${memory.usagePercent}%`;
    ramProgress.style.width = `${memory.usagePercent}%`;
    updateProgressColor(ramProgress, memory.usagePercent);
    
    // Disk (first mount)
    if (disk && disk.length > 0) {
      const mainDisk = disk.find(d => d.mount === '/') || disk[0];
      diskValue.textContent = `${mainDisk.usagePercent}%`;
      diskProgress.style.width = `${mainDisk.usagePercent}%`;
      updateProgressColor(diskProgress, mainDisk.usagePercent);
    }
    
    connectionStatus.classList.add('connected');
    connectionStatus.classList.remove('error');
  }
}

function updateProgressColor(element, value) {
  element.classList.remove('warning', 'danger');
  if (value > 90) {
    element.classList.add('danger');
  } else if (value > 70) {
    element.classList.add('warning');
  }
}

async function updateWireGuard() {
  const data = await fetchAPI('/wireguard');
  if (data.success) {
    wgToggle.checked = data.active;
    wgStatus.textContent = data.active ? 'Активний' : 'Вимкнений';
    
    // Show peers
    if (data.peers && data.peers.length > 0) {
      wgPeers.innerHTML = data.peers.map(peer => `
        <div class="peer">
          <strong>Peer:</strong> ${peer.publicKey?.substring(0, 12)}...<br>
          ${peer.endpoint ? `<small>Endpoint: ${peer.endpoint}</small>` : ''}
        </div>
      `).join('');
    } else {
      wgPeers.innerHTML = '';
    }
  } else {
    wgStatus.textContent = 'Недоступний';
    wgToggle.disabled = true;
  }
}

async function updateLogs() {
  const data = await fetchAPI('/status/logs?limit=20');
  if (data.success && data.logs) {
    logsContainer.innerHTML = data.logs.map(log => `
      <div class="log-entry ${log.level || ''}">${log.timestamp || ''} ${log.message || log}</div>
    `).join('');
  }
}

// Event handlers
wgToggle.addEventListener('change', async () => {
  wgToggle.disabled = true;
  wgStatus.textContent = 'Перемикаю...';
  
  const result = await postAPI('/wireguard/toggle');
  
  if (result.success) {
    await updateWireGuard();
  } else {
    alert(`Помилка: ${result.error}`);
    wgToggle.checked = !wgToggle.checked;
  }
  
  wgToggle.disabled = false;
});

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

// Initialize
async function init() {
  await Promise.all([
    updateBotStatus(),
    updateSystemMetrics(),
    updateWireGuard(),
    updateLogs()
  ]);
  
  // Auto-refresh every 5 seconds
  updateInterval = setInterval(() => {
    updateSystemMetrics();
  }, 5000);
  
  // Refresh WireGuard and logs less frequently
  setInterval(() => {
    updateWireGuard();
    updateLogs();
  }, 15000);
}

// Start
init();

// Cleanup on page hide
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    clearInterval(updateInterval);
  } else {
    init();
  }
});
