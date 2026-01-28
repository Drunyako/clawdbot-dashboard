/**
 * System Metrics Service
 * Збір інформації про сервер
 */

const si = require('systeminformation');

async function getMetrics() {
  const [cpu, mem, disk, load, time] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.fullLoad(),
    si.time()
  ]);
  
  return {
    cpu: {
      usage: Math.round(cpu.currentLoad * 10) / 10,
      cores: cpu.cpus.length
    },
    memory: {
      total: formatBytes(mem.total),
      used: formatBytes(mem.used),
      free: formatBytes(mem.free),
      usagePercent: Math.round((mem.used / mem.total) * 100)
    },
    disk: disk.map(d => ({
      mount: d.mount,
      total: formatBytes(d.size),
      used: formatBytes(d.used),
      free: formatBytes(d.available),
      usagePercent: Math.round(d.use)
    })),
    uptime: time.uptime,
    load: {
      avg1: load
    }
  };
}

async function getCpuUsage() {
  const cpu = await si.currentLoad();
  return {
    usage: Math.round(cpu.currentLoad * 10) / 10,
    cores: cpu.cpus.map((c, i) => ({
      core: i,
      usage: Math.round(c.load * 10) / 10
    }))
  };
}

async function getMemoryUsage() {
  const mem = await si.mem();
  return {
    total: mem.total,
    used: mem.used,
    free: mem.free,
    available: mem.available,
    usagePercent: Math.round((mem.used / mem.total) * 100),
    formatted: {
      total: formatBytes(mem.total),
      used: formatBytes(mem.used),
      free: formatBytes(mem.free)
    }
  };
}

async function getDiskUsage() {
  const disks = await si.fsSize();
  return disks.map(d => ({
    mount: d.mount,
    fs: d.fs,
    type: d.type,
    size: d.size,
    used: d.used,
    available: d.available,
    usagePercent: Math.round(d.use),
    formatted: {
      size: formatBytes(d.size),
      used: formatBytes(d.used),
      available: formatBytes(d.available)
    }
  }));
}

async function getNetworkStats() {
  const network = await si.networkStats();
  return network.map(n => ({
    interface: n.iface,
    rx: formatBytes(n.rx_bytes),
    tx: formatBytes(n.tx_bytes),
    rx_sec: formatBytes(n.rx_sec) + '/s',
    tx_sec: formatBytes(n.tx_sec) + '/s'
  }));
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

module.exports = {
  getMetrics,
  getCpuUsage,
  getMemoryUsage,
  getDiskUsage,
  getNetworkStats,
  formatBytes,
  formatUptime
};
