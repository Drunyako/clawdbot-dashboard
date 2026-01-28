/**
 * Parser Routes
 * /api/parser/*
 */

const express = require('express');
const parserService = require('../services/parser');

module.exports = function(config) {
  const router = express.Router();
  
  // GET /api/parser/status - Статус парсера
  router.get('/status', async (req, res) => {
    try {
      const status = await parserService.getStatus();
      res.json({ success: true, ...status });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/parser/start - Запустити парсер
  router.post('/start', async (req, res) => {
    try {
      const result = await parserService.start();
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/parser/stop - Зупинити парсер
  router.post('/stop', async (req, res) => {
    try {
      const result = await parserService.stop();
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/parser/toggle - Переключити парсер
  router.post('/toggle', async (req, res) => {
    try {
      const result = await parserService.toggle();
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // GET /api/parser/logs - Останні логи
  router.get('/logs', async (req, res) => {
    try {
      const lines = parseInt(req.query.lines) || 50;
      const logs = await parserService.getLogs(lines);
      res.json({ success: true, logs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  return router;
};
