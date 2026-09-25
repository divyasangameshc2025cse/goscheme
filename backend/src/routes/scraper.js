/**
 * GO SCHEME - Scraper API Routes
 * Exposes live status, on-demand trigger, and historical execution logs.
 */

const express = require('express');
const router = express.Router();
const {
  getSchedulerStatus,
  triggerScraperManually,
  getScraperLogs
} = require('../scraper/scheduler');

// GET /api/scraper/status - Check automated scraper status & statistics
router.get('/status', async (req, res) => {
  try {
    const status = await getSchedulerStatus();
    res.json({
      success: true,
      data: status
    });
  } catch (err) {
    console.error('Error fetching scraper status:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve scraper status', error: err.message });
  }
});

// POST /api/scraper/trigger - Run scraper immediately on-demand
router.post('/trigger', async (req, res) => {
  try {
    const triggerSource = req.body?.source || 'API Request / Admin Trigger';
    console.log(`[API] Manual scrape requested via ${triggerSource}`);
    
    const result = await triggerScraperManually(triggerSource);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Automated scraper completed successfully and database is synchronized.',
        result
      });
    } else {
      res.status(result.message ? 409 : 500).json({
        success: false,
        message: result.message || 'Scraper run failed',
        error: result.error
      });
    }
  } catch (err) {
    console.error('Error triggering manual scrape:', err);
    res.status(500).json({ success: false, message: 'Failed to trigger scraper', error: err.message });
  }
});

// GET /api/scraper/logs - Get recent scraper execution logs
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const logs = await getScraperLogs(limit);
    res.json({
      success: true,
      logs
    });
  } catch (err) {
    console.error('Error fetching scraper logs:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch scraper logs', error: err.message });
  }
});

module.exports = router;
