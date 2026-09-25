/**
 * Scraper Verification Test Script
 */
const cheerio = require('cheerio');

async function testFetch() {
  console.log('Testing live fetch from TN Social Welfare Schemes Portal...');
  try {
    const res = await fetch('https://tnsocialwelfare.tn.gov.in/en/spec/schemes');
    const html = await res.text();
    const $ = cheerio.load(html);
    const schemes = [];

    $('a').each((i, el) => {
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (text && href && (href.includes('scheme') || href.includes('welfare') || href.includes('specilisation'))) {
        if (!schemes.some(s => s.title === text) && text.length > 5 && !text.includes('Tamil Nadu') && !text.includes('Menu')) {
          schemes.push({
            title: text,
            url: href.startsWith('http') ? href : `https://tnsocialwelfare.tn.gov.in${href}`
          });
        }
      }
    });

    console.log(`✅ Extracted ${schemes.length} live schemes from portal:`);
    schemes.slice(0, 8).forEach((s, idx) => console.log(`  ${idx + 1}. ${s.title} -> ${s.url}`));
    return schemes;
  } catch (err) {
    console.error('Error fetching live portal:', err);
    return [];
  }
}

if (require.main === module) {
  testFetch().then(() => process.exit(0));
}

module.exports = { testFetch };
