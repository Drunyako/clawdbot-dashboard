/**
 * Parser Routes
 * /api/parser/*
 */

const express = require('express');
const parserService = require('../services/parser');

module.exports = function(config) {
  const router = express.Router();
  
  // GET /api/parser/list - Список всіх парсерів
  router.get('/list', async (req, res) => {
    try {
      const parsers = parserService.getAvailableParsers();
      res.json({ success: true, parsers });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // GET /api/parser/status - Статус всіх парсерів
  router.get('/status', async (req, res) => {
    try {
      const status = await parserService.getAllStatus();
      res.json({ success: true, parsers: status });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // GET /api/parser/:id/status - Статус конкретного парсера
  router.get('/:id/status', async (req, res) => {
    try {
      const status = await parserService.getStatus(req.params.id);
      res.json({ success: true, ...status });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/parser/:id/start - Запустити парсер
  router.post('/:id/start', async (req, res) => {
    try {
      const result = await parserService.start(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/parser/:id/stop - Зупинити парсер
  router.post('/:id/stop', async (req, res) => {
    try {
      const result = await parserService.stop(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/parser/:id/toggle - Переключити парсер
  router.post('/:id/toggle', async (req, res) => {
    try {
      const result = await parserService.toggle(req.params.id);
      res.json(result);
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // GET /api/parser/:id/logs - Логи парсера
  router.get('/:id/logs', async (req, res) => {
    try {
      const lines = parseInt(req.query.lines) || 50;
      const logs = await parserService.getLogs(req.params.id, lines);
      res.json({ success: true, logs });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  return router;
};
