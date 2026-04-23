import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

function AddedToast({ name }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold text-white animate-slide-up"
      style={{
        background: 'linear-gradient(135deg, rgba(52,211,153,0.95), rgba(16,185,129,0.9))',
        boxShadow: '0 8px 24px rgba(52,211,153,0.4)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <span>✓</span>
      <span>{name} added to cart</span>
    </div>
  );
}

function MenuItem({ item, onAdd }) {
  return (
    <article
      className="group flex flex-col rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: 'rgba(10,18,40,0.7)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(16px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(251,113,133,0.25)';
        e.currentTarget.style.boxShadow = '0 12px 30px rgba(0,0,0,0.4), 0 0 30px rgba(251,113,133,0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      <div className="flex flex-1 items-start justify-between gap-4 p-5">
        <div className="flex-1">
          <h3 className="font-semibold text-white leading-tight">{item.name}</h3>
          {item.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-slate-400 line-clamp-2">{item.description}</p>
          )}
          <p
            className="mt-3 font-display text-xl font-black"
            style={{ color: '#fb7185' }}
          >
            ${item.price.toFixed(2)}
          </p>
        </div>
        {/* Placeholder food image */}
        <div
          className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-4xl"
          style={{ background: 'rgba(251,113,133,0.08)', border: '1px solid rgba(251,113,133,0.12)' }}
        >
          🍽️
        </div>
      </div>

      <div className="border-t px-5 pb-4 pt-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <button
          type="button"
          onClick={() => onAdd(item)}
          className="w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all duration-300"
          style={{
            background: 'rgba(251,113,133,0.12)',
            border: '1px solid rgba(251,113,133,0.25)',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #fb7185, #f43f5e)';
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(251,113,133,0.45)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(251,113,133,0.12)';
            e.currentTarget.style.borderColor = 'rgba(251,113,133,0.25)';
            e.currentTarget.style.boxShadow = '';
          }}
        >
          + Add to cart
        </button>
      </div>
    </article>
  );
}

function RestaurantDetailPage() {
  const { id } = useParams();
  const { addToCart, items } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [toast, setToast] = useState(null);
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const [restaurantRes, menuRes] = await Promise.all([
        api.get(`/restaurants/${id}`),
        api.get(`/restaurants/${id}/menu`),
      ]);
      setRestaurant(restaurantRes.data.data);
      setMenuItems(menuRes.data.data);
    };
    fetchData();
  }, [id]);

  const groupedMenu = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [menuItems]);

  const categories = Object.keys(groupedMenu);

  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  const handleAddToCart = (item) => {
    addToCart({
      menuItemId: item._id,
      name: item.name,
      price: item.price,
      restaurantId: restaurant._id,
    });
    setToast(item.name);
    setTimeout(() => setToast(null), 2200);
  };

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (!restaurant) {
    return (
      <main className="page-shell">
        <div className="flex flex-col items-center justify-center py-32">
          <div className="mb-4 text-5xl animate-float">🍽️</div>
          <p className="text-slate-400">Loading restaurant…</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* ── Hero banner ── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(251,113,133,0.2), rgba(244,63,94,0.08), rgba(139,92,246,0.12))',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="page-shell py-10 md:py-14">
          <Link
            to="/restaurants"
            className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 no-underline transition-colors hover:text-coral"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to restaurants
          </Link>

          <div className="flex items-start gap-6">
            <div
              className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-4xl md:h-24 md:w-24 md:text-5xl"
              style={{
                background: 'rgba(251,113,133,0.12)',
                border: '1px solid rgba(251,113,133,0.2)',
              }}
            >
              🍽️
            </div>
            <div>
              <h1 className="font-display text-3xl font-black text-white md:text-4xl">{restaurant.name}</h1>
              <p className="mt-2 max-w-lg text-slate-400">{restaurant.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="badge badge-coral">{restaurant.category || 'Restaurant'}</span>
                <span className="text-sm text-slate-500">⭐ {restaurant.rating || '4.5'}</span>
                <span className="text-sm text-slate-500">·</span>
                <span className="text-sm text-slate-500">🕐 25–35 min</span>
                <span className="text-sm text-slate-500">·</span>
                <span className="text-sm text-slate-500">🛵 Free delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="page-shell">
        {menuItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <span className="mb-4 text-5xl">📋</span>
            <h3 className="mb-2 font-display text-xl font-bold text-white">Menu coming soon</h3>
            <p className="text-slate-500">This restaurant hasn't added any items yet.</p>
          </div>
        ) : (
          <div className="mt-8 flex gap-8">
            {/* ── Sticky category sidebar ── */}
            {categories.length > 1 && (
              <aside className="hidden w-44 shrink-0 lg:block">
                <div className="sticky top-24 space-y-1">
                  <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-500">Menu</p>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setActiveCategory(cat);
                        document.getElementById(`cat-${cat}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200"
                      style={
                        activeCategory === cat
                          ? { background: 'rgba(251,113,133,0.12)', color: '#fb7185', border: 'none', cursor: 'pointer' }
                          : { background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer' }
                      }
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </aside>
            )}

            {/* ── Menu sections ── */}
            <div className="flex-1 space-y-10 pb-24">
              {categories.map((cat) => (
                <section key={cat} id={`cat-${cat}`}>
                  <div className="mb-5 flex items-center gap-3">
                    <h2 className="font-display text-2xl font-bold text-white">{cat}</h2>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ background: 'rgba(255,255,255,0.07)', color: '#64748b' }}
                    >
                      {groupedMenu[cat].length}
                    </span>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    {groupedMenu[cat].map((item) => (
                      <MenuItem key={item._id} item={item} onAdd={handleAddToCart} />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Floating cart button ── */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <Link
            to="/cart"
            className="flex items-center gap-3 rounded-2xl px-6 py-4 no-underline"
            style={{
              background: 'linear-gradient(135deg, #fb7185, #f43f5e)',
              boxShadow: '0 8px 30px rgba(251,113,133,0.55)',
              backdropFilter: 'blur(10px)',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.95rem',
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            View Cart · {cartCount} item{cartCount !== 1 ? 's' : ''}
          </Link>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && <AddedToast name={toast} />}
    </main>
  );
}

export default RestaurantDetailPage;
