/**
 * GO SCHEME - Automated Scraper Scheduler
 * Uses node-cron and timers to automatically trigger data updates in the background.
 */

const cron = require('node-cron');
const { runAutomatedScraper } = require('./engine');
const { getAsync, allAsync } = require('../db/database');

let cronJob = null;
let isScrapingInProgress = false;
let lastRunResult = null;

// Default schedule: Every 6 hours ('0 */6 * * *') or configurable via env
const CRON_SCHEDULE = process.env.SCRAPER_CRON_SCHEDULE || '0 */6 * * *';

/**
 * Initialize and start the automated background scraper scheduler
 */
function startScraperScheduler() {
  if (cronJob) {
    console.log('[Scheduler] Scraper cron job is already running.');
    return;
  }

  console.log(`[Scheduler] ⏰ Initializing automated scheme scraper with schedule: "${CRON_SCHEDULE}"`);

  cronJob = cron.schedule(CRON_SCHEDULE, async () => {
    if (isScrapingInProgress) {
      console.log('[Scheduler] Previous scrape still in progress, skipping this interval.');
      return;
    }

    try {
      isScrapingInProgress = true;
      console.log('[Scheduler] ⏰ Scheduled cron triggered: Starting automatic scheme update...');
      lastRunResult = await runAutomatedScraper('Cron Scheduled Update');
    } catch (err) {
      console.error('[Scheduler] Error during scheduled scraper execution:', err);
    } finally {
      isScrapingInProgress = false;
    }
  });

  // Optional: Trigger initial synchronization 10 seconds after server boot
  setTimeout(async () => {
    try {
      const recentLog = await getAsync(`SELECT started_at FROM scraper_logs ORDER BY id DESC LIMIT 1`);
      const shouldRunInitial = !recentLog;
      if (shouldRunInitial) {
        console.log('[Scheduler] 🚀 Running initial automated scheme sync...');
        isScrapingInProgress = true;
        lastRunResult = await runAutomatedScraper('Initial Boot Sync');
        isScrapingInProgress = false;
      } else {
        console.log(`[Scheduler] ℹ️ Recent sync was at: ${recentLog.started_at}. Next scheduled run according to cron.`);
      }
    } catch (err) {
      console.warn('[Scheduler] Notice during initial boot sync check:', err.message);
      isScrapingInProgress = false;
    }
  }, 10000);

  return cronJob;
}

/**
 * Stop the background scheduler
 */
function stopScraperScheduler() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[Scheduler] Scraper cron job stopped.');
  }
}

/**
 * Trigger manual scraper run on demand (via API or Admin button)
 */
async function triggerScraperManually(triggerSource = 'Manual Trigger') {
  if (isScrapingInProgress) {
    return {
      success: false,
      message: 'A scrape run is already in progress. Please wait a moment.'
    };
  }

  try {
    isScrapingInProgress = true;
    lastRunResult = await runAutomatedScraper(triggerSource);
    return lastRunResult;
  } finally {
    isScrapingInProgress = false;
  }
}

/**
 * Fetch current status of scheduler and last run
 */
async function getSchedulerStatus() {
  const lastLog = await getAsync(`SELECT * FROM scraper_logs ORDER BY id DESC LIMIT 1`);
  const totalCountRow = await getAsync(`SELECT COUNT(*) as count FROM schemes`);
  const tnCountRow = await getAsync(`SELECT COUNT(*) as count FROM schemes WHERE level = 'Tamil Nadu'`);

  return {
    isSchedulerActive: Boolean(cronJob),
    schedule: CRON_SCHEDULE,
    isScrapingInProgress,
    lastRunResult,
    lastLog: lastLog || null,
    totalSchemesInDatabase: totalCountRow ? totalCountRow.count : 0,
    tamilNaduSchemesCount: tnCountRow ? tnCountRow.count : 0
  };
}

/**
 * Fetch recent scraper logs
 */
async function getScraperLogs(limit = 20) {
  return await allAsync(`SELECT * FROM scraper_logs ORDER BY id DESC LIMIT ?`, [limit]);
}

module.exports = {
  startScraperScheduler,
  stopScraperScheduler,
  triggerScraperManually,
  getSchedulerStatus,
  getScraperLogs
};
