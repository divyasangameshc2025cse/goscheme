#!/usr/bin/env node
/**
 * GO SCHEME - Standalone Scraper CLI Tool
 * Can be run manually or via server scripts: npm run scrape
 */

const { initDatabaseSchema } = require('../db/database');
const { runAutomatedScraper } = require('./engine');

async function main() {
  console.log('🔄 Initializing GoScheme Database connection...');
  await initDatabaseSchema();

  console.log('📡 Running Live Scheme Scraper...');
  const result = await runAutomatedScraper('CLI Standalone Execution');

  if (result.success) {
    console.log('\n====================================================');
    console.log('🎉 Scraper Completed Successfully!');
    console.log(`📊 Schemes Processed : ${result.schemesScraped}`);
    console.log(`➕ New Schemes Added  : ${result.schemesAdded}`);
    console.log(`🔄 Schemes Updated    : ${result.schemesUpdated}`);
    console.log(`💾 Total in Database  : ${result.totalInDatabase}`);
    console.log('====================================================\n');
    process.exit(0);
  } else {
    console.error('\n❌ Scraper Execution Failed:', result.error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
