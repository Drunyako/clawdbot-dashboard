/**
 * System Routes
 * /api/system/*
 */

const express = require('express');
const systemService = require('../services/system');

module.exports = function(config) {
  const router = express.Router();
  
  // GET /api/system - Всі метрики
  router.get('/', async (req, res) => {
    try {
      const metrics = await systemService.getMetrics();
      res.json({ success: true, metrics });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // GET /api/system/cpu - CPU usage
  router.get('/cpu', async (req, res) => {
    try {
      const cpu = await systemService.getCpuUsage();
      res.json({ success: true, cpu });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // GET /api/system/memory - Memory usage
  router.get('/memory', async (req, res) => {
    try {
      const memory = await systemService.getMemoryUsage();
      res.json({ success: true, memory });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // GET /api/system/disk - Disk usage
  router.get('/disk', async (req, res) => {
    try {
      const disk = await systemService.getDiskUsage();
      res.json({ success: true, disk });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  // GET /api/system/network - Network stats
  router.get('/network', async (req, res) => {
    try {
      const network = await systemService.getNetworkStats();
      res.json({ success: true, network });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
  
  return router;
};
