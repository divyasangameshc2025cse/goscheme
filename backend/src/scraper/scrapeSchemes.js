/**
 * Government Scheme Scraper
 * ---------------------------------------------------------------------------
 * Pulls "live" scheme data from official government sources and upserts it
 * into the local schemes table, tagged with a sector (category) so the
 * frontend can keep serving schemes sector-by-sector instead of one giant list.
 *
 * Two source types are supported out of the box:
 *
 *  1. JSON_API sources  – official portals that expose a JSON search API
 *     (e.g. myScheme's public search endpoint). These are the most reliable
 *     because there is no HTML structure to break.
 *
 *  2. HTML sources – static/server-rendered listing pages, scraped with
 *     cheerio using CSS selectors.
 *
 * IMPORTANT / HONEST LIMITATIONS:
 *  - Government sites change their markup and APIs without notice, and some
 *    (myScheme, several state portals) render results client-side with
 *    JavaScript, which plain axios+cheerio cannot execute. If a source stops
 *    returning data, check `node src/scraper/scrapeSchemes.js --debug` output
 *    and update its selectors/endpoint below.
 *  - This sandbox cannot reach government domains to test live (network is
 *    restricted here), so this scraper is written defensively — every source
 *    runs in its own try/catch and a failure in one never blocks the others
 *    or crashes the run. Run it from your own machine/server where outbound
 *    internet access is available.
 *  - Always scrape responsibly: this script sends one request at a time with
 *    a delay between requests and a descriptive User-Agent, and only reads
 *    public pages. Check each site's Terms of Use / robots.txt before
 *    running this against it in production, and prefer an official API or
 *    open-data export (e.g. data.gov.in) wherever one exists.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { runAsync, allAsync } = require('../db/database');
const { metaFor } = require('../db/sectors');

const USER_AGENT = 'GoSchemeBot/1.0 (+educational scheme aggregator; contact: admin@goscheme.local)';
const REQUEST_DELAY_MS = 1200;

const http = axios.create({
  timeout: 15000,
  headers: { 'User-Agent': USER_AGENT, Accept: 'application/json, text/html' }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Sector classification — used whenever a source doesn't already give us a
// clean category, so scraped rows still land in the right sector bucket.
// ---------------------------------------------------------------------------
const SECTOR_KEYWORDS = [
  { category: 'Women & Child Welfare', words: ['women', 'girl', 'widow', 'child', 'maternity', 'anganwadi', 'pregnan'] },
  { category: 'Scholarship & Education', words: ['scholarship', 'education', 'student', 'school', 'college', 'tuition', 'fellowship'] },
  { category: 'Healthcare', words: ['health', 'hospital', 'medical', 'insurance', 'ayushman', 'treatment', 'disease'] },
  { category: 'Pension & Social Security', words: ['pension', 'senior citizen', 'old age', 'social security'] },
  { category: 'Agriculture', words: ['farmer', 'agriculture', 'crop', 'irrigation', 'kisan', 'fisher', 'livestock'] },
  { category: 'Entrepreneurship & Loans', words: ['loan', 'startup', 'entrepreneur', 'msme', 'business', 'credit', 'udyam', 'mudra'] },
  { category: 'Housing', words: ['housing', 'house', 'awas', 'shelter', 'home loan'] },
  { category: 'Skill Development & Employment', words: ['skill', 'employment', 'job', 'training', 'apprentice', 'placement'] },
  { category: 'Solar & Energy', words: ['solar', 'energy', 'electricity', 'renewable', 'power'] }
];

function classifySector(text) {
  const lower = (text || '').toLowerCase();
  for (const bucket of SECTOR_KEYWORDS) {
    if (bucket.words.some(w => lower.includes(w))) return bucket.category;
  }
  return 'General Welfare & Benefits';
}

// ---------------------------------------------------------------------------
// Source 1: myScheme public search API (JSON)
// The myScheme frontend (a Digital India / MeitY platform) calls a JSON
// search API to populate its results grid. Endpoint/param names on
// government platforms change occasionally — if this starts returning
// non-2xx or an unexpected shape, update BASE_URL/params here.
// ---------------------------------------------------------------------------
async function scrapeMyScheme({ pages = 3, pageSize = 20 } = {}) {
  const BASE_URL = 'https://api.myscheme.gov.in/search/v5/schemes';
  const results = [];

  for (let i = 0; i < pages; i++) {
    try {
      const { data } = await http.get(BASE_URL, {
        params: { lang: 'en', q: '[]', keyword: '', sort: '', from: i * pageSize, size: pageSize }
      });

      const hits = data?.data?.hits?.items || data?.data?.hits || [];
      if (!Array.isArray(hits) || hits.length === 0) break;

      for (const hit of hits) {
        const f = hit.fields || hit;
        const title = f.schemeName?.[0] || f.schemeName || f.title;
        if (!title) continue;

        const isStateScheme = (f.schemeCategory?.[0] || '').toLowerCase().includes('state');
        const stateName = f.state?.[0] || f.state || (isStateScheme ? 'Unspecified State' : 'All India');

        results.push({
          id: `MS-${f.schemeId?.[0] || f.schemeId || title.slice(0, 12)}`,
          title,
          department: (f.nodalMinistryName?.[0] || f.nodalMinistryName || 'Government of India'),
          level: isStateScheme ? 'State' : 'Central',
          state: stateName,
          category: classifySector(`${title} ${f.tags?.join(' ') || ''}`),
          benefits: f.briefDescription?.[0] || f.briefDescription || 'See official page for benefit details',
          description: f.briefDescription?.[0] || f.briefDescription || title,
          officialUrl: f.slug ? `https://www.myscheme.gov.in/schemes/${Array.isArray(f.slug) ? f.slug[0] : f.slug}` : 'https://www.myscheme.gov.in',
          source: 'myscheme.gov.in'
        });
      }

      await sleep(REQUEST_DELAY_MS);
    } catch (err) {
      console.warn(`[scraper] myScheme page ${i} failed:`, err.message);
      break; // stop paging this source, but let other sources continue
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Source 2: generic static HTML listing scraper (cheerio)
// Point this at a state/ministry "schemes list" page that renders plain HTML
// (many do — e.g. department press-release / scheme-list pages). Adjust the
// selectors to match the target page's markup.
// ---------------------------------------------------------------------------
async function scrapeHtmlListing({ url, itemSelector, titleSelector, linkSelector, level = 'State', state = 'Unspecified State', sourceName }) {
  const results = [];
  try {
    const { data: html } = await http.get(url);
    const $ = cheerio.load(html);

    $(itemSelector).each((_, el) => {
      const title = $(el).find(titleSelector).first().text().trim();
      let link = $(el).find(linkSelector).first().attr('href') || '';
      if (link && !link.startsWith('http')) {
        try { link = new URL(link, url).toString(); } catch { /* keep raw */ }
      }
      if (!title) return;

      results.push({
        id: `${sourceName.toUpperCase().slice(0, 4)}-${title.slice(0, 10).replace(/\s+/g, '')}-${results.length}`,
        title,
        department: sourceName,
        level,
        state,
        category: classifySector(title),
        benefits: 'See official page for benefit details',
        description: title,
        officialUrl: link || url,
        source: sourceName
      });
    });
  } catch (err) {
    console.warn(`[scraper] HTML source "${sourceName}" failed:`, err.message);
  }
  return results;
}

// Configure whichever official state/ministry listing pages you want to
// track here. These are examples — verify the selectors against the live
// page's HTML (view-source) before enabling, since layouts change.
const HTML_SOURCES = [
  // {
  //   sourceName: 'tn.gov.in',
  //   url: 'https://www.tn.gov.in/scheme',
  //   itemSelector: '.view-content .views-row',
  //   titleSelector: 'a',
  //   linkSelector: 'a',
  //   level: 'State',
  //   state: 'Tamil Nadu'
  // }
];

// ---------------------------------------------------------------------------
// Upsert scraped rows into the schemes table
// ---------------------------------------------------------------------------
async function upsertScrapedSchemes(rows) {
  let inserted = 0, updated = 0;

  for (const s of rows) {
    const existing = await allAsync(`SELECT id FROM schemes WHERE id = ?`, [s.id]);
    const sector = metaFor(s.category);

    const common = [
      s.title,
      s.department,
      s.level,
      s.state || (s.level === 'Central' ? 'All India' : 'Unspecified State'),
      sector.category,
      0, 100, 'All', 9999999,
      JSON.stringify(['All']), JSON.stringify(['All']), JSON.stringify(['All']),
      'All Tamil Nadu Districts',
      s.benefits,
      '2027-12-31',
      s.officialUrl,
      s.description,
      JSON.stringify(['Aadhaar Card']),
      1, 'Active'
    ];

    if (existing.length > 0) {
      await runAsync(
        `UPDATE schemes SET title=?, department=?, level=?, state=?, category=?, min_age=?, max_age=?, gender=?, income_cap=?,
         education=?, occupation=?, caste_category=?, district_eligibility=?, benefits=?, application_deadline=?,
         official_url=?, description=?, documents=?, is_new=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`,
        [...common, s.id]
      );
      updated++;
    } else {
      await runAsync(
        `INSERT INTO schemes (id, title, department, level, state, category, min_age, max_age, gender, income_cap,
         education, occupation, caste_category, district_eligibility, benefits, application_deadline,
         official_url, description, documents, is_new, status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
        [s.id, ...common]
      );
      inserted++;
    }
  }

  return { inserted, updated, total: rows.length };
}

async function runScrape() {
  console.log('[scraper] Starting government scheme scrape...');
  const collected = [];

  const myScheme = await scrapeMyScheme({ pages: 3 });
  console.log(`[scraper] myScheme: ${myScheme.length} schemes`);
  collected.push(...myScheme);

  for (const src of HTML_SOURCES) {
    const rows = await scrapeHtmlListing(src);
    console.log(`[scraper] ${src.sourceName}: ${rows.length} schemes`);
    collected.push(...rows);
    await sleep(REQUEST_DELAY_MS);
  }

  if (collected.length === 0) {
    console.log('[scraper] No schemes collected — keeping existing dataset untouched.');
    return { inserted: 0, updated: 0, total: 0 };
  }

  const summary = await upsertScrapedSchemes(collected);
  console.log(`[scraper] Done. Inserted ${summary.inserted}, updated ${summary.updated}, total processed ${summary.total}.`);
  return summary;
}

module.exports = { runScrape, classifySector, scrapeMyScheme, scrapeHtmlListing };

// Allow `node src/scraper/scrapeSchemes.js` to run standalone.
if (require.main === module) {
  runScrape().then(() => process.exit(0)).catch(err => {
    console.error('[scraper] Fatal error:', err);
    process.exit(1);
  });
}
