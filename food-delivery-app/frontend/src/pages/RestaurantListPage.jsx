import { useEffect, useState } from 'react';
import api from '../services/api';
import RestaurantCard from '../components/RestaurantCard';

const CATEGORIES = ['All', 'Asian', 'Italian', 'Fast Food', 'Dessert', 'Sushi', 'Indian', 'Mexican', 'Healthy'];

function RestaurantListPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      const params = {};
      if (query) params.q = query;
      if (category && category !== 'All') params.category = category;
      const res = await api.get('/restaurants', { params });
      setRestaurants(res.data.data);
      setLoading(false);
    };

    const debounce = setTimeout(fetchRestaurants, 250);
    return () => clearTimeout(debounce);
  }, [query, category]);

  return (
    <main className="page-shell">
      {/* ── Page header ── */}
      <div className="mb-8">
        <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-coral">Explore</p>
        <h1 className="font-display text-4xl font-black text-white md:text-5xl">
          Discover Restaurants
        </h1>
        <p className="mt-2 text-slate-400">
          {loading ? 'Finding the best spots near you…' : `${restaurants.length} restaurant${restaurants.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* ── Search bar ── */}
      <div
        className="mb-6 flex items-center gap-3 rounded-2xl px-5 py-4"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <svg
          width="20" height="20" viewBox="0 0 24 24" fill="none"
          stroke="rgba(148,163,184,0.6)" strokeWidth="2.5" strokeLinecap="round"
          className="shrink-0"
        >
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          className="flex-1 bg-transparent text-base text-slate-100 outline-none placeholder:text-slate-500"
          placeholder="Search by name, cuisine or dish…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="shrink-0 text-slate-500 transition-colors hover:text-slate-300"
            style={{ background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Category chips ── */}
      <div className="mb-8 flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat) => {
          const active = (cat === 'All' && !category) || category === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat === 'All' ? '' : cat)}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-all duration-200"
              style={
                active
                  ? {
                      background: 'linear-gradient(135deg, #fb7185, #f43f5e)',
                      color: '#fff',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(251,113,133,0.4)',
                      cursor: 'pointer',
                    }
                  : {
                      background: 'rgba(255,255,255,0.05)',
                      color: '#94a3b8',
                      border: '1px solid rgba(255,255,255,0.08)',
                      cursor: 'pointer',
                    }
              }
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Results ── */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ background: 'rgba(10,18,40,0.8)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="skeleton h-36" />
              <div className="p-5 space-y-3">
                <div className="skeleton h-5 w-3/4" />
                <div className="skeleton h-3 w-full" />
                <div className="skeleton h-3 w-2/3" />
                <div className="skeleton h-9 w-full mt-4 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="mb-4 text-6xl">🍽️</span>
          <h3 className="mb-2 font-display text-xl font-bold text-white">No restaurants found</h3>
          <p className="text-slate-500">Try adjusting your search or clearing the filters.</p>
          <button
            type="button"
            onClick={() => { setQuery(''); setCategory(''); }}
            className="btn-primary mt-6"
            style={{ padding: '0.625rem 1.5rem', fontSize: '0.9rem' }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <section className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((r) => (
            <RestaurantCard key={r._id} restaurant={r} />
          ))}
        </section>
      )}
    </main>
  );
}

export default RestaurantListPage;
