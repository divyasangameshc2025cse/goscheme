import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import SEO from '../components/SEO.jsx';
import SectorCard from '../components/SectorCard.jsx';
import SchemeCard from '../components/SchemeCard.jsx';
import { sectorsApi, savedApi } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function ExploreSchemes() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSlug = searchParams.get('sector') || '';

  const [sectors, setSectors] = useState([]);
  const [sectorsLoading, setSectorsLoading] = useState(true);

  const [schemes, setSchemes] = useState([]);
  const [sectorMeta, setSectorMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('All');
  const [stateFilter, setStateFilter] = useState('All');
  const [loadingSchemes, setLoadingSchemes] = useState(false);

  const [savedIds, setSavedIds] = useState([]);

  // Step 1: load ONLY the sector list — a tiny payload that paints instantly.
  useEffect(() => {
    sectorsApi
      .list()
      .then(({ data }) => setSectors(data.sectors || []))
      .catch(() => setSectors([]))
      .finally(() => setSectorsLoading(false));
  }, []);

  useEffect(() => {
    if (user) savedApi.list().then(({ data }) => setSavedIds(data.savedIds || [])).catch(() => {});
  }, [user]);

  // Step 2: only when a sector is selected do we fetch its schemes — never
  // the whole catalog at once.
  const loadSector = useCallback((slug, pageNum, searchTerm, levelFilter, stateValue) => {
    if (!slug) return;
    setLoadingSchemes(true);
    sectorsApi
      .schemesBySector(slug, {
        page: pageNum,
        limit: 12,
        search: searchTerm || undefined,
        level: levelFilter !== 'All' ? levelFilter : undefined,
        state: stateValue && stateValue !== 'All' ? stateValue : undefined,
      })
      .then(({ data }) => {
        setSchemes(data.schemes || []);
        setSectorMeta(data.sector || null);
        setTotalPages(data.totalPages || 1);
      })
      .catch(() => {
        setSchemes([]);
        setTotalPages(1);
      })
      .finally(() => setLoadingSchemes(false));
  }, []);

  useEffect(() => {
    setPage(1);
    if (activeSlug) loadSector(activeSlug, 1, search, level, stateFilter);
  }, [activeSlug]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (activeSlug) loadSector(activeSlug, page, search, level, stateFilter);
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSectorClick = (slug) => {
    setSearchParams(slug === activeSlug ? {} : { sector: slug });
    setSearch('');
    setLevel('All');
    setStateFilter('All');
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    loadSector(activeSlug, 1, search, level, stateFilter);
  };

  const handleToggleSave = async (schemeId) => {
    if (!user) return;
    const { data } = await savedApi.toggle(schemeId);
    if (data.success) setSavedIds(data.savedIds);
  };

  return (
    <div className="container-app py-10">
      <SEO
        title="Explore schemes by sector"
        description="Browse government schemes split by sector — agriculture, education, health, housing and more — for a fast, focused search."
        path="/explore"
      />

      <h1 className="text-2xl font-extrabold text-navy">Explore schemes by sector</h1>
      <p className="mt-1 text-sm text-slate-500">
        Pick a sector to load just those schemes — faster than scrolling through everything at once.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {sectorsLoading
          ? Array.from({ length: 10 }).map((_, i) => <div key={i} className="skeleton h-28" />)
          : sectors.map((s) => (
              <SectorCard key={s.slug} sector={s} active={s.slug === activeSlug} onClick={() => handleSectorClick(s.slug)} />
            ))}
      </div>

      {activeSlug && (
        <div className="mt-8">
          <form onSubmit={handleFilterSubmit} className="flex flex-col gap-3 sm:flex-row">
            <input
              className="input-field sm:max-w-xs"
              placeholder={`Search in ${sectorMeta?.category || 'sector'}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select className="input-field sm:max-w-[160px]" value={level} onChange={(e) => setLevel(e.target.value)}>
              <option value="All">All levels</option>
              <option value="Central">Central</option>
              <option value="State">State</option>
            </select>
            <select className="input-field sm:max-w-[180px]" value={stateFilter} onChange={(e) => setStateFilter(e.target.value)}>
              <option value="All">All states</option>
              <option value="Tamil Nadu">Tamil Nadu only</option>
            </select>
            <button type="submit" className="btn-secondary sm:w-auto">Filter</button>
          </form>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {loadingSchemes
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-56" />)
              : schemes.map((s) => (
                  <SchemeCard
                    key={s.id}
                    scheme={s}
                    onToggleSave={user ? handleToggleSave : undefined}
                    isSaved={savedIds.includes(s.id)}
                  />
                ))}
          </div>

          {!loadingSchemes && schemes.length === 0 && (
            <p className="mt-8 text-center text-sm text-slate-400">No schemes found for this filter.</p>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                className="btn-secondary !px-4 !py-2 text-sm disabled:opacity-40"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-sm font-semibold text-slate-500">Page {page} of {totalPages}</span>
              <button
                className="btn-secondary !px-4 !py-2 text-sm disabled:opacity-40"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
