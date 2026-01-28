/**
 * WireGuard Control Service
 * Управління WireGuard VPN
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function getStatus(interfaceName = 'wg0') {
  try {
    const { stdout } = await execAsync(`sudo wg show ${interfaceName} 2>/dev/null || echo "inactive"`);
    
    if (stdout.trim() === 'inactive' || stdout.trim() === '') {
      return {
        active: false,
        interface: interfaceName,
        peers: []
      };
    }
    
    // Parse wg show output
    const lines = stdout.split('\n');
    const peers = [];
    let currentPeer = null;
    
    for (const line of lines) {
      if (line.startsWith('peer:')) {
        if (currentPeer) peers.push(currentPeer);
        currentPeer = { publicKey: line.split(':')[1]?.trim() };
      } else if (currentPeer && line.includes('endpoint:')) {
        currentPeer.endpoint = line.split(':').slice(1).join(':').trim();
      } else if (currentPeer && line.includes('latest handshake:')) {
        currentPeer.lastHandshake = line.split(':').slice(1).join(':').trim();
      } else if (currentPeer && line.includes('transfer:')) {
        const transfer = line.split(':')[1]?.trim();
        currentPeer.transfer = transfer;
      }
    }
    if (currentPeer) peers.push(currentPeer);
    
    return {
      active: true,
      interface: interfaceName,
      peers
    };
  } catch (err) {
    return {
      active: false,
      interface: interfaceName,
      error: err.message,
      peers: []
    };
  }
}

async function start(interfaceName = 'wg0') {
  try {
    await execAsync(`sudo wg-quick up ${interfaceName}`);
    return { success: true, message: `WireGuard ${interfaceName} started` };
  } catch (err) {
    // Check if already running
    if (err.message.includes('already exists')) {
      return { success: true, message: `WireGuard ${interfaceName} вже запущений` };
    }
    throw new Error(`Не вдалося запустити WireGuard: ${err.message}`);
  }
}

async function stop(interfaceName = 'wg0') {
  try {
    await execAsync(`sudo wg-quick down ${interfaceName}`);
    return { success: true, message: `WireGuard ${interfaceName} stopped` };
  } catch (err) {
    // Check if already stopped
    if (err.message.includes('is not a WireGuard interface')) {
      return { success: true, message: `WireGuard ${interfaceName} вже зупинений` };
    }
    throw new Error(`Не вдалося зупинити WireGuard: ${err.message}`);
  }
}

async function toggle(interfaceName = 'wg0') {
  const status = await getStatus(interfaceName);
  if (status.active) {
    return await stop(interfaceName);
  } else {
    return await start(interfaceName);
  }
}

module.exports = {
  getStatus,
  start,
  stop,
  toggle
};
