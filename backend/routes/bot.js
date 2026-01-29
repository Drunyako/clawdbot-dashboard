/**
 * Bot Control Routes
 * /api/bot/*
 */

const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

module.exports = function(config) {
  const router = express.Router();
  
  // POST /api/bot/model - Change model
  router.post('/model', async (req, res) => {
    const model = req.query.model || req.body.model;
    
    if (!model) {
      return res.status(400).json({ success: false, error: 'Model not specified' });
    }
    
    // Map aliases to full model names
    const modelMap = {
      'opus': 'anthropic/claude-opus-4-5',
      'sonnet': 'anthropic/claude-sonnet-4'
    };
    
    const fullModel = modelMap[model] || model;
    
    try {
      // Use clawdbot CLI to change model
      await execAsync(`clawdbot config set defaultModel "${fullModel}"`);
      res.json({ success: true, model: fullModel });
    } catch (err) {
      console.error('Model change error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // POST /api/bot/restart - Restart gateway/sessions
  router.post('/restart', async (req, res) => {
    try {
      // Restart clawdbot gateway
      await execAsync('clawdbot gateway restart');
      res.json({ success: true, message: 'Gateway restarted' });
    } catch (err) {
      console.error('Restart error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // GET /api/bot/status - Get bot status
  router.get('/status', async (req, res) => {
    try {
      const { stdout } = await execAsync('clawdbot gateway status --json 2>/dev/null || clawdbot status --json 2>/dev/null || echo "{}"');
      const status = JSON.parse(stdout || '{}');
      res.json({ success: true, ...status });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  return router;
};
