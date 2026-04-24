import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DELIVERY_STATUS_CONFIG = {
  pending:    { icon: '🕐', label: 'Pending',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',    border: 'rgba(245,158,11,0.2)'  },
  assigned:   { icon: '📋', label: 'Assigned',   color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',    border: 'rgba(96,165,250,0.2)'  },
  picked_up:  { icon: '🏍️', label: 'Picked Up', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',    border: 'rgba(96,165,250,0.2)'  },
  in_transit: { icon: '📍', label: 'In Transit', color: '#a855f7', bg: 'rgba(168,85,247,0.1)',   border: 'rgba(168,85,247,0.2)'  },
  delivered:  { icon: '✅', label: 'Delivered',  color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.2)'  },
};

function DriverDashboardPage() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [available, setAvailable] = useState([]);
  const [tab, setTab] = useState('active');
  const [coords, setCoords] = useState({ latitude: '', longitude: '' });
  const [updating, setUpdating] = useState(null);
  const [claiming, setClaiming] = useState(null);
  const [autoGps, setAutoGps] = useState(false);

  const loadDeliveries = async () => {
    try {
      const res = await api.get('/delivery/driver/active');
      setDeliveries(res.data.data);
    } catch {
      setDeliveries([]);
    }
  };

  const loadAvailable = async () => {
    try {
      const res = await api.get('/delivery/available');
      setAvailable(res.data.data);
    } catch {
      setAvailable([]);
    }
  };

  useEffect(() => {
    loadDeliveries();
    loadAvailable();
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) return;
    setAutoGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6),
        });
        setAutoGps(false);
      },
      () => setAutoGps(false)
    );
  };

  const claimOrder = async (orderId) => {
    setClaiming(orderId);
    try {
      await api.post('/delivery/assign', { orderId });
      await Promise.all([loadDeliveries(), loadAvailable()]);
      setTab('active');
    } catch {
      // already claimed by someone else — refresh list
      await loadAvailable();
    } finally {
      setClaiming(null);
    }
  };

  const updateLocation = async (orderId, status) => {
    setUpdating(orderId + status);
    try {
      await api.put(`/delivery/${orderId}/location`, {
        latitude: Number(coords.latitude),
        longitude: Number(coords.longitude),
        status,
      });
      await loadDeliveries();
    } finally {
      setUpdating(null);
    }
  };

  const activeCount = deliveries.filter((d) => d.status !== 'delivered').length;

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
          <p className="mb-1 text-sm font-semibold uppercase tracking-widest" style={{ color: '#34d399' }}>Driver</p>
          <h1 className="font-display text-4xl font-black text-white">Driver Hub</h1>
          <p className="mt-1 text-slate-400">
            {activeCount > 0
              ? `${activeCount} active deliver${activeCount !== 1 ? 'ies' : 'y'}`
              : available.length > 0
                ? `${available.length} order${available.length !== 1 ? 's' : ''} available to claim`
                : 'No active deliveries'}
          </p>
        </div>
        <div
          className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}
        >
          <span className="live-dot" />
          <span className="text-sm font-semibold" style={{ color: '#34d399' }}>Online</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { icon: '📦', label: 'Total', value: deliveries.length, color: '#60a5fa' },
          { icon: '🏍️', label: 'Active', value: activeCount, color: '#f59e0b' },
          { icon: '✅', label: 'Done', value: deliveries.filter((d) => d.status === 'delivered').length, color: '#34d399' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="rounded-2xl p-5 text-center" style={cardStyle}>
            <div className="mb-2 text-2xl">{icon}</div>
            <p className="font-display text-3xl font-black" style={{ color }}>{value}</p>
            <p className="mt-1 text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* ── GPS panel ── */}
      <div className="mb-8 rounded-2xl p-6" style={cardStyle}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-white">📍 GPS Location</h2>
          <button
            type="button"
            onClick={detectLocation}
            disabled={autoGps}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all duration-200"
            style={{
              background: 'rgba(52,211,153,0.1)',
              border: '1px solid rgba(52,211,153,0.25)',
              color: '#34d399',
              cursor: 'pointer',
              opacity: autoGps ? 0.6 : 1,
            }}
          >
            {autoGps ? (
              <>
                <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeDashoffset="20"/>
                </svg>
                Detecting…
              </>
            ) : '🎯 Auto-detect'}
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Latitude</label>
            <input className="input-field" placeholder="e.g. 6.9271" value={coords.latitude} onChange={(e) => setCoords((p) => ({ ...p, latitude: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Longitude</label>
            <input className="input-field" placeholder="e.g. 79.8612" value={coords.longitude} onChange={(e) => setCoords((p) => ({ ...p, longitude: e.target.value }))} />
          </div>
        </div>
        {coords.latitude && coords.longitude && (
          <p className="mt-3 text-xs text-slate-500">
            📌 Current: {Number(coords.latitude).toFixed(4)}, {Number(coords.longitude).toFixed(4)}
          </p>
        )}
      </div>

      {/* ── Tabs ── */}
      <div
        className="mb-6 flex rounded-2xl p-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', width: 'fit-content' }}
      >
        {[
          { key: 'active', label: '🏍️ My Deliveries', count: deliveries.length },
          { key: 'available', label: '📋 Available Orders', count: available.length },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200"
            style={
              tab === key
                ? { background: 'linear-gradient(135deg, #34d399, #059669)', color: '#fff', boxShadow: '0 4px 14px rgba(52,211,153,0.4)', border: 'none', cursor: 'pointer' }
                : { background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer' }
            }
          >
            {label}
            <span
              className="rounded-full px-1.5 py-0.5 text-xs"
              style={tab === key ? { background: 'rgba(255,255,255,0.25)', color: '#fff' } : { background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Active deliveries tab ── */}
      {tab === 'active' && (
        <div>
          {deliveries.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
              style={{ background: 'rgba(10,18,40,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="mb-4 text-5xl">🏍️</span>
              <h3 className="mb-2 font-display text-xl font-bold text-white">No active deliveries</h3>
              <p className="mb-4 text-slate-500">Claim an available order to get started.</p>
              <button
                type="button"
                onClick={() => setTab('available')}
                className="rounded-xl px-5 py-2.5 text-sm font-bold"
                style={{ background: 'linear-gradient(135deg, #34d399, #059669)', color: '#fff', border: 'none', cursor: 'pointer' }}
              >
                View Available Orders
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => {
                const config = DELIVERY_STATUS_CONFIG[delivery.status] || DELIVERY_STATUS_CONFIG.assigned;
                return (
                  <div
                    key={delivery._id}
                    className="overflow-hidden rounded-2xl"
                    style={{ background: 'rgba(10,18,40,0.8)', border: `1px solid ${config.border}`, backdropFilter: 'blur(16px)' }}
                  >
                    <div
                      className="flex items-center justify-between px-5 py-4"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: config.bg }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{config.icon}</span>
                        <div>
                          <p className="font-semibold text-white">
                            Order #{String(delivery.orderId).slice(-8).toUpperCase()}
                          </p>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: config.color }}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 p-5">
                      <p className="mb-1 w-full text-xs font-semibold uppercase tracking-wider text-slate-500">Update status:</p>
                      {[
                        { status: 'picked_up',  label: 'Picked Up',  icon: '📦', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)'  },
                        { status: 'in_transit', label: 'In Transit', icon: '🏍️', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)' },
                        { status: 'delivered',  label: 'Delivered',  icon: '✅', color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.25)'  },
                      ].map(({ status, label, icon, color, bg, border }) => (
                        <button
                          key={status}
                          type="button"
                          disabled={updating === delivery.orderId + status}
                          onClick={() => updateLocation(delivery.orderId, status)}
                          className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200"
                          style={{ background: bg, border: `1px solid ${border}`, color, cursor: 'pointer', opacity: updating === delivery.orderId + status ? 0.6 : 1 }}
                        >
                          {updating === delivery.orderId + status ? (
                            <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeDashoffset="20"/>
                            </svg>
                          ) : <span>{icon}</span>}
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Available orders tab ── */}
      {tab === 'available' && (
        <div>
          {available.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
              style={{ background: 'rgba(10,18,40,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <span className="mb-4 text-5xl">📭</span>
              <h3 className="mb-2 font-display text-xl font-bold text-white">No orders available</h3>
              <p className="text-slate-500">Orders marked "Ready" by restaurants will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {available.map((order) => (
                <div
                  key={order._id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5"
                  style={{ background: 'rgba(10,18,40,0.8)', border: '1px solid rgba(52,211,153,0.2)', backdropFilter: 'blur(16px)' }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl font-display text-sm font-black"
                      style={{ background: 'rgba(52,211,153,0.1)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}
                    >
                      #{order._id.slice(-3).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">Order #{order._id.slice(-8).toUpperCase()}</p>
                      <p className="mt-0.5 text-xs text-slate-400">
                        {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} · ${order.totalAmount?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={claiming === order._id}
                    onClick={() => claimOrder(order._id)}
                    className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200"
                    style={{
                      background: 'linear-gradient(135deg, #34d399, #059669)',
                      color: '#fff',
                      border: 'none',
                      cursor: claiming === order._id ? 'not-allowed' : 'pointer',
                      opacity: claiming === order._id ? 0.7 : 1,
                      boxShadow: '0 4px 14px rgba(52,211,153,0.35)',
                    }}
                  >
                    {claiming === order._id ? (
                      <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeDashoffset="20"/>
                      </svg>
                    ) : '🏍️'}
                    {claiming === order._id ? 'Claiming…' : 'Claim Delivery'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}

export default DriverDashboardPage;
