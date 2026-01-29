/**
 * Claude Usage Routes
 * /api/claude/*
 */

const express = require('express');
const claudeService = require('../services/claude');

module.exports = function(config) {
  const router = express.Router();
  
  // GET /api/claude/usage - Отримати статистику використання
  router.get('/usage', async (req, res) => {
    try {
      const usage = await claudeService.getUsage();
      res.json({ success: true, usage });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/claude/usage - Оновити використання вручну
  router.post('/usage', async (req, res) => {
    try {
      const usage = await claudeService.setUsage(req.body);
      res.json({ success: true, usage });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/claude/usage/add - Додати використані токени
  router.post('/usage/add', async (req, res) => {
    try {
      const { tokens } = req.body;
      if (typeof tokens !== 'number') {
        return res.status(400).json({ success: false, error: 'tokens must be a number' });
      }
      const usage = await claudeService.addUsage(tokens);
      res.json({ success: true, usage });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/claude/clawdbot - Оновлення від Clawdbot
  router.post('/clawdbot', async (req, res) => {
    try {
      const { statusText } = req.body;
      if (!statusText) {
        return res.status(400).json({ success: false, error: 'statusText required' });
      }
      const usage = await claudeService.updateFromClawdbot(statusText);
      res.json({ success: true, usage });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // GET /api/claude/refresh - Оновити usage через API
  router.get('/refresh', async (req, res) => {
    try {
      const usage = await claudeService.refreshFromAPI();
      res.json({ success: true, usage });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  return router;
};
