/**
 * WireGuard Routes
 * /api/wireguard/*
 */

const express = require('express');
const wireguardService = require('../services/wireguard');

module.exports = function(config) {
  const router = express.Router();
  
  const interfaceName = config.wireguard?.interface || 'wg0';
  
  // GET /api/wireguard - Статус WireGuard
  router.get('/', async (req, res) => {
    try {
      const status = await wireguardService.getStatus(interfaceName);
      res.json({ success: true, ...status });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/wireguard/start - Запустити WireGuard
  router.post('/start', async (req, res) => {
    try {
      const result = await wireguardService.start(interfaceName);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/wireguard/stop - Зупинити WireGuard
  router.post('/stop', async (req, res) => {
    try {
      const result = await wireguardService.stop(interfaceName);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/wireguard/toggle - Переключити WireGuard
  router.post('/toggle', async (req, res) => {
    try {
      const result = await wireguardService.toggle(interfaceName);
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  return router;
};
