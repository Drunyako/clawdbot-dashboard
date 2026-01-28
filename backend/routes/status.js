/**
 * Status Routes
 * /api/status/*
 */

const express = require('express');
const clawdbotService = require('../services/clawdbot');

module.exports = function(config) {
  const router = express.Router();
  
  // GET /api/status - Загальний статус
  router.get('/', async (req, res) => {
    try {
      const status = await clawdbotService.getStatus(config);
      res.json({ success: true, status });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // GET /api/status/sessions - Активні сесії
  router.get('/sessions', async (req, res) => {
    try {
      const sessions = await clawdbotService.getSessions(config);
      res.json({ success: true, sessions });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // GET /api/status/logs - Логи
  router.get('/logs', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const logs = await clawdbotService.getLogs(config, limit);
      res.json({ success: true, logs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  return router;
};
