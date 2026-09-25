// Canonical sector (category) metadata.
// The `schemes.category` column IS the sector. This file just gives each
// sector a stable slug + display icon so the API/frontend can be driven by
// data instead of hard-coded lists.

const SECTORS = [
  { slug: 'women-child', category: 'Women & Child Welfare', icon: '👩‍👧', color: '#F43F5E' },
  { slug: 'education', category: 'Scholarship & Education', icon: '🎓', color: '#2563EB' },
  { slug: 'welfare', category: 'General Welfare & Benefits', icon: '🤝', color: '#0D9488' },
  { slug: 'healthcare', category: 'Healthcare', icon: '🏥', color: '#10B981' },
  { slug: 'pension', category: 'Pension & Social Security', icon: '🧓', color: '#F59E0B' },
  { slug: 'agriculture', category: 'Agriculture', icon: '🌾', color: '#65A30D' },
  { slug: 'business', category: 'Entrepreneurship & Loans', icon: '💼', color: '#7C3AED' },
  { slug: 'housing', category: 'Housing', icon: '🏠', color: '#DB2777' },
  { slug: 'employment', category: 'Skill Development & Employment', icon: '🛠️', color: '#0EA5E9' },
  { slug: 'energy', category: 'Solar & Energy', icon: '☀️', color: '#EA580C' }
];

function slugToCategory(slug) {
  const s = SECTORS.find(s => s.slug === slug);
  return s ? s.category : null;
}

function categoryToSlug(category) {
  const s = SECTORS.find(s => s.category.toLowerCase() === String(category).toLowerCase());
  return s ? s.slug : (category || 'other').toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

function metaFor(category) {
  return SECTORS.find(s => s.category.toLowerCase() === String(category).toLowerCase())
    || { slug: categoryToSlug(category), category, icon: '📄', color: '#64748B' };
}

module.exports = { SECTORS, slugToCategory, categoryToSlug, metaFor };
