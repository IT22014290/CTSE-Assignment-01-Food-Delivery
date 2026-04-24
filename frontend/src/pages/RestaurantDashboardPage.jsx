import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  pending:   { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', border: 'rgba(245,158,11,0.25)' },
  confirmed: { bg: 'rgba(96,165,250,0.12)', text: '#60a5fa', border: 'rgba(96,165,250,0.25)' },
  preparing: { bg: 'rgba(168,85,247,0.12)', text: '#a855f7', border: 'rgba(168,85,247,0.25)' },
  ready:     { bg: 'rgba(52,211,153,0.12)', text: '#34d399', border: 'rgba(52,211,153,0.25)' },
};

function StatusBadge({ status }) {
  const s = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider"
      style={{ background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
    >
      {status}
    </span>
  );
}

function RestaurantDashboardPage() {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState('');
  const [orders, setOrders] = useState([]);
  const [tab, setTab] = useState('orders');
  const [menuForm, setMenuForm] = useState({ name: '', category: '', price: '', description: '' });
  const [adding, setAdding] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);
  const [addError, setAddError] = useState('');
  const [restaurantForm, setRestaurantForm] = useState({ name: '', category: '', address: '', description: '' });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadRestaurants = async () => {
    try {
      const res = await api.get('/restaurants');
      const mine = res.data.data.filter((r) => r.ownerId === user?.id);
      setRestaurants(mine);
      if (mine.length > 0) setSelected((prev) => prev || mine[0]._id);
    } catch {
      // keep existing state
    }
  };

  useEffect(() => {
    loadRestaurants();
  }, []);

  useEffect(() => {
    if (!selected) return;
    const loadOrders = async () => {
      try {
        const res = await api.get(`/orders/restaurant/${selected}`);
        setOrders(res.data.data);
      } catch {
        // keep last known state
      }
    };
    loadOrders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, [selected]);

  const createRestaurant = async (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      await api.post('/restaurants', restaurantForm);
      setRestaurantForm({ name: '', category: '', address: '', description: '' });
      await loadRestaurants();
      setTab('menu');
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create restaurant');
    } finally {
      setCreating(false);
    }
  };

  const addMenuItem = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setAdding(true);
    setAddError('');
    try {
      await api.post(`/restaurants/${selected}/menu`, { ...menuForm, price: Number(menuForm.price) });
      setMenuForm({ name: '', category: '', price: '', description: '' });
      setAddSuccess(true);
      setTimeout(() => setAddSuccess(false), 2500);
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add menu item');
    } finally {
      setAdding(false);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    await api.put(`/orders/${orderId}/status`, { status });
    const refreshed = await api.get(`/orders/restaurant/${selected}`);
    setOrders(refreshed.data.data);
  };

  const selectedRestaurant = restaurants.find((r) => r._id === selected);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const preparingCount = orders.filter((o) => ['confirmed', 'preparing'].includes(o.status)).length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  const cardStyle = {
    background: 'rgba(10,18,40,0.8)',
    border: '1px solid rgba(255,255,255,0.08)',
    backdropFilter: 'blur(20px)',
  };

  return (
    <main className="page-shell">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm font-semibold uppercase tracking-widest" style={{ color: '#fb7185' }}>Owner</p>
          <h1 className="font-display text-4xl font-black text-white">Restaurant Dashboard</h1>
          {selectedRestaurant && (
            <p className="mt-1 text-slate-400">{selectedRestaurant.name}</p>
          )}
        </div>
        {restaurants.length > 1 && (
          <select
            className="input-field w-auto"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ minWidth: '200px' }}
          >
            {restaurants.map((r) => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* ── No restaurant yet ── */}
      {restaurants.length === 0 && tab !== 'create' && (
        <div
          className="mb-8 flex flex-col items-center justify-center rounded-2xl p-12 text-center"
          style={cardStyle}
        >
          <span className="mb-4 text-5xl">🍽️</span>
          <h3 className="mb-2 font-display text-2xl font-bold text-white">No restaurant yet</h3>
          <p className="mb-6 text-slate-400">Create your restaurant first to start managing orders and menu items.</p>
          <button className="btn-primary" onClick={() => setTab('create')}>
            + Create My Restaurant
          </button>
        </div>
      )}

      {/* ── Stats cards (only shown when restaurant exists) ── */}
      {restaurants.length > 0 && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: '📋', label: 'Total Orders', value: orders.length, accent: '#60a5fa' },
            { icon: '🔔', label: 'New Orders', value: pendingCount, accent: '#f59e0b' },
            { icon: '👨‍🍳', label: 'Preparing', value: preparingCount, accent: '#a855f7' },
            { icon: '📦', label: 'Ready', value: readyCount, accent: '#34d399' },
          ].map(({ icon, label, value, accent }) => (
            <div key={label} className="rounded-2xl p-5" style={cardStyle}>
              <div className="mb-3 text-2xl">{icon}</div>
              <p className="font-display text-3xl font-black" style={{ color: accent }}>{value}</p>
              <p className="mt-1 text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tabs ── */}
      <div
        className="mb-6 flex rounded-2xl p-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', width: 'fit-content' }}
      >
        {[
          ...(restaurants.length > 0 ? [
            { key: 'orders', label: '📋 Orders', count: orders.length },
            { key: 'menu', label: '➕ Add Menu Item', count: null },
          ] : []),
          { key: 'create', label: '🏪 Create Restaurant', count: null },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200"
            style={
              tab === key
                ? { background: 'linear-gradient(135deg, #fb7185, #f43f5e)', color: '#fff', boxShadow: '0 4px 14px rgba(251,113,133,0.4)', border: 'none', cursor: 'pointer' }
                : { background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer' }
            }
          >
            {label}
            {count !== null && (
              <span
                className="rounded-full px-1.5 py-0.5 text-xs"
                style={tab === key ? { background: 'rgba(255,255,255,0.25)', color: '#fff' } : { background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Create Restaurant tab ── */}
      {tab === 'create' && (
        <div className="max-w-lg">
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="mb-5 font-display text-xl font-bold text-white">Create Your Restaurant</h2>
            {createError && (
              <div className="mb-4 rounded-xl p-3 text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                {createError}
              </div>
            )}
            <form onSubmit={createRestaurant} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Restaurant Name</label>
                <input className="input-field" placeholder="e.g. Pizza Palace" value={restaurantForm.name} onChange={(e) => setRestaurantForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Category</label>
                  <input className="input-field" placeholder="e.g. Italian" value={restaurantForm.category} onChange={(e) => setRestaurantForm((p) => ({ ...p, category: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Address</label>
                  <input className="input-field" placeholder="e.g. 123 Main St" value={restaurantForm.address} onChange={(e) => setRestaurantForm((p) => ({ ...p, address: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label>
                <textarea className="input-field" placeholder="Tell customers about your restaurant…" rows={3} value={restaurantForm.description} onChange={(e) => setRestaurantForm((p) => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" disabled={creating} className="btn-primary w-full" style={{ padding: '0.875rem', opacity: creating ? 0.7 : 1 }}>
                {creating ? 'Creating…' : '🏪 Create Restaurant'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Orders tab ── */}
      {tab === 'orders' && restaurants.length > 0 && (
        <div className="space-y-3">
          {orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <span className="mb-4 text-5xl">📭</span>
              <h3 className="mb-2 font-display text-xl font-bold text-white">No orders yet</h3>
              <p className="text-slate-500">New orders will appear here automatically.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 transition-all duration-200"
                style={{ background: 'rgba(10,18,40,0.75)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-black" style={{ background: 'rgba(251,113,133,0.1)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.2)' }}>
                    #{order._id.slice(-3).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-white">Order #{order._id.slice(-8).toUpperCase()}</p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {order.items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <StatusBadge status={order.status} />
                      <span className="text-xs text-slate-500">${order.totalAmount?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    className="rounded-xl px-3 py-2 text-sm font-semibold text-white outline-none"
                    value={order.status}
                    onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="preparing">Preparing</option>
                    <option value="ready">Ready</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Add menu item tab ── */}
      {tab === 'menu' && restaurants.length > 0 && (
        <div className="max-w-lg">
          <div className="rounded-2xl p-6" style={cardStyle}>
            <h2 className="mb-5 font-display text-xl font-bold text-white">Add New Menu Item</h2>
            {addSuccess && (
              <div className="mb-5 flex items-center gap-2 rounded-xl p-3 text-sm font-semibold" style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399' }}>
                ✓ Menu item added successfully!
              </div>
            )}
            {addError && (
              <div className="mb-5 rounded-xl p-3 text-sm font-semibold" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>
                {addError}
              </div>
            )}
            <form onSubmit={addMenuItem} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Item Name</label>
                <input className="input-field" placeholder="e.g. Spicy Chicken Burger" value={menuForm.name} onChange={(e) => setMenuForm((p) => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Category</label>
                  <input className="input-field" placeholder="e.g. Burgers" value={menuForm.category} onChange={(e) => setMenuForm((p) => ({ ...p, category: e.target.value }))} required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Price ($)</label>
                  <input className="input-field" placeholder="0.00" type="number" step="0.01" min="0" value={menuForm.price} onChange={(e) => setMenuForm((p) => ({ ...p, price: e.target.value }))} required />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Description</label>
                <textarea className="input-field" placeholder="Describe this dish…" rows={3} value={menuForm.description} onChange={(e) => setMenuForm((p) => ({ ...p, description: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <button type="submit" disabled={adding} className="btn-primary w-full" style={{ padding: '0.875rem', fontSize: '0.95rem', opacity: adding ? 0.7 : 1 }}>
                {adding ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeDashoffset="20"/>
                    </svg>
                    Adding item…
                  </span>
                ) : '+ Add to Menu'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default RestaurantDashboardPage;
