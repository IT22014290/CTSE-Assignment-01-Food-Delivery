import { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const driverIcon = L.divIcon({
  html: `<div style="
    width:36px;height:36px;
    background:linear-gradient(135deg,#34d399,#059669);
    border-radius:50% 50% 50% 0;transform:rotate(-45deg);
    box-shadow:0 4px 14px rgba(52,211,153,0.6);
    border:2px solid rgba(255,255,255,0.9);
    display:flex;align-items:center;justify-content:center;">
    <span style="transform:rotate(45deg);font-size:14px;display:block;line-height:1;margin-top:2px;">🏍️</span>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
});

const STATUS_CFG = {
  assigned:   { icon: '📋', label: 'Assigned',   color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)'  },
  picked_up:  { icon: '🏍️', label: 'Picked Up', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)'  },
  in_transit: { icon: '📍', label: 'In Transit', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)'  },
  delivered:  { icon: '✅', label: 'Delivered',  color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.2)'  },
};

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-base">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-slate-200 break-words">{value || '—'}</p>
      </div>
    </div>
  );
}

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
    const interval = setInterval(() => {
      loadDeliveries();
      loadAvailable();
    }, 10000);
    return () => clearInterval(interval);
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
      await api.post('/delivery/claim', { orderId });
      await Promise.all([loadDeliveries(), loadAvailable()]);
      setTab('active');
    } catch {
      await loadAvailable();
    } finally {
      setClaiming(null);
    }
  };

  const updateStatus = async (orderId, status) => {
    if (!coords.latitude || !coords.longitude) {
      alert('Please set your GPS location first before updating status.');
      return;
    }
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
  const hasCoords = coords.latitude && coords.longitude;

  const cardStyle = {
    background: 'rgba(10,18,40,0.85)',
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
            {user?.name && <span className="text-slate-300">{user.name} · </span>}
            {activeCount > 0
              ? `${activeCount} active deliver${activeCount !== 1 ? 'ies' : 'y'}`
              : available.length > 0
                ? `${available.length} order${available.length !== 1 ? 's' : ''} ready to claim`
                : 'No active deliveries'}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full px-4 py-2"
          style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}>
          <span className="live-dot" />
          <span className="text-sm font-semibold" style={{ color: '#34d399' }}>Online</span>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[
          { icon: '📦', label: 'Total',  value: deliveries.length,                                   color: '#60a5fa' },
          { icon: '🏍️', label: 'Active', value: activeCount,                                         color: '#f59e0b' },
          { icon: '✅', label: 'Done',   value: deliveries.filter((d) => d.status === 'delivered').length, color: '#34d399' },
        ].map(({ icon, label, value, color }) => (
          <div key={label} className="rounded-2xl p-5 text-center" style={cardStyle}>
            <div className="mb-2 text-2xl">{icon}</div>
            <p className="font-display text-3xl font-black" style={{ color }}>{value}</p>
            <p className="mt-1 text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* ── GPS panel ── */}
      <div className="mb-8 rounded-2xl overflow-hidden" style={cardStyle}>
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h2 className="font-display text-lg font-bold text-white">📍 Your GPS Location</h2>
          <button
            type="button"
            onClick={detectLocation}
            disabled={autoGps}
            className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold"
            style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', color: '#34d399', cursor: 'pointer', opacity: autoGps ? 0.6 : 1 }}
          >
            {autoGps ? (
              <><svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeDashoffset="20"/></svg>Detecting…</>
            ) : '🎯 Auto-detect'}
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Latitude</label>
              <input className="input-field" placeholder="e.g. 6.9271" value={coords.latitude}
                onChange={(e) => setCoords((p) => ({ ...p, latitude: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Longitude</label>
              <input className="input-field" placeholder="e.g. 79.8612" value={coords.longitude}
                onChange={(e) => setCoords((p) => ({ ...p, longitude: e.target.value }))} />
            </div>
          </div>

          {!hasCoords && (
            <p className="text-xs text-amber-400/80 font-medium">
              ⚠️ Set your location before updating delivery status — it will be shared with the customer.
            </p>
          )}
        </div>

        {/* Live map of driver position */}
        {hasCoords && (
          <MapContainer
            key={`${coords.latitude},${coords.longitude}`}
            center={[Number(coords.latitude), Number(coords.longitude)]}
            zoom={14}
            style={{ height: '220px', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[Number(coords.latitude), Number(coords.longitude)]} icon={driverIcon}>
              <Popup>
                <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
                  🏍️ Your current position<br />
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {Number(coords.latitude).toFixed(5)}, {Number(coords.longitude).toFixed(5)}
                  </span>
                </div>
              </Popup>
            </Marker>
          </MapContainer>
        )}
      </div>

      {/* ── Tabs ── */}
      <div className="mb-6 flex rounded-2xl p-1"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', width: 'fit-content' }}>
        {[
          { key: 'active',    label: '🏍️ My Deliveries',    count: deliveries.length },
          { key: 'available', label: '📋 Available Orders', count: available.length  },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-200"
            style={
              tab === key
                ? { background: 'linear-gradient(135deg,#34d399,#059669)', color: '#fff', boxShadow: '0 4px 14px rgba(52,211,153,0.4)', border: 'none', cursor: 'pointer' }
                : { background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer' }
            }
          >
            {label}
            <span className="rounded-full px-1.5 py-0.5 text-xs"
              style={tab === key ? { background: 'rgba(255,255,255,0.25)', color: '#fff' } : { background: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Active deliveries ── */}
      {tab === 'active' && (
        <div>
          {deliveries.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
              style={{ background: 'rgba(10,18,40,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="mb-4 text-5xl">🏍️</span>
              <h3 className="mb-2 font-display text-xl font-bold text-white">No active deliveries</h3>
              <p className="mb-4 text-slate-500">Claim an order from the Available Orders tab.</p>
              <button type="button" onClick={() => setTab('available')}
                className="rounded-xl px-5 py-2.5 text-sm font-bold"
                style={{ background: 'linear-gradient(135deg,#34d399,#059669)', color: '#fff', border: 'none', cursor: 'pointer' }}>
                View Available Orders
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {deliveries.map((delivery) => {
                const cfg = STATUS_CFG[delivery.status] || STATUS_CFG.assigned;
                const order = delivery.order;
                const restaurant = delivery.restaurant;
                return (
                  <div key={delivery._id} className="overflow-hidden rounded-2xl"
                    style={{ background: 'rgba(10,18,40,0.85)', border: `1px solid ${cfg.border}`, backdropFilter: 'blur(16px)' }}>

                    {/* Card header */}
                    <div className="flex items-center justify-between px-5 py-4"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: cfg.bg }}>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cfg.icon}</span>
                        <div>
                          <p className="font-bold text-white">Order #{String(delivery.orderId).slice(-8).toUpperCase()}</p>
                          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cfg.color }}>{cfg.label}</span>
                        </div>
                      </div>
                      {order?.totalAmount && (
                        <p className="font-display text-xl font-black" style={{ color: '#34d399' }}>
                          ${order.totalAmount.toFixed(2)}
                        </p>
                      )}
                    </div>

                    <div className="p-5 space-y-5">
                      {/* Pickup & customer info */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-3 rounded-xl p-4"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#fb7185' }}>📦 Pickup From</p>
                          <InfoRow icon="🏢" label="Restaurant" value={restaurant?.name} />
                          <InfoRow icon="📍" label="Address"    value={restaurant?.address} />
                          <InfoRow icon="🍽️" label="Category"  value={restaurant?.category} />
                        </div>
                        <div className="space-y-3 rounded-xl p-4"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#60a5fa' }}>👤 Customer</p>
                          <InfoRow icon="🆔" label="Customer Ref" value={`#${String(order?.customerId || '').slice(-8).toUpperCase()}`} />
                          <InfoRow icon="📦" label="Items" value={`${order?.items?.length || 0} item${order?.items?.length !== 1 ? 's' : ''}`} />
                          <InfoRow icon="💰" label="Order Total" value={order?.totalAmount ? `$${order.totalAmount.toFixed(2)}` : null} />
                        </div>
                      </div>

                      {/* Order items list */}
                      {order?.items?.length > 0 && (
                        <div className="rounded-xl p-4"
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">🛒 Items to deliver</p>
                          <div className="space-y-2">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold"
                                    style={{ background: 'rgba(251,113,133,0.15)', color: '#fb7185' }}>
                                    {item.quantity}
                                  </span>
                                  <span className="text-sm text-slate-300">{item.name}</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-400">
                                  ${(item.quantity * item.unitPrice).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Status buttons */}
                      <div>
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Update delivery status:</p>
                        {!hasCoords && (
                          <p className="mb-3 text-xs text-amber-400/80">⚠️ Set your GPS coordinates above before updating status.</p>
                        )}
                        <div className="flex flex-wrap gap-3">
                          {[
                            { status: 'picked_up',  label: 'Picked Up',  icon: '📦', color: '#a855f7', bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.25)' },
                            { status: 'in_transit', label: 'In Transit', icon: '🏍️', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)' },
                            { status: 'delivered',  label: 'Delivered',  icon: '✅', color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' },
                          ].map(({ status, label, icon, color, bg, border }) => {
                            const busy = updating === delivery.orderId + status;
                            return (
                              <button
                                key={status}
                                type="button"
                                disabled={busy || !hasCoords}
                                onClick={() => updateStatus(delivery.orderId, status)}
                                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-200"
                                style={{ background: bg, border: `1px solid ${border}`, color, cursor: (busy || !hasCoords) ? 'not-allowed' : 'pointer', opacity: (busy || !hasCoords) ? 0.5 : 1 }}
                              >
                                {busy ? (
                                  <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeDashoffset="20"/>
                                  </svg>
                                ) : icon}
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Available orders ── */}
      {tab === 'available' && (
        <div>
          {available.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
              style={{ background: 'rgba(10,18,40,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="mb-4 text-5xl">📭</span>
              <h3 className="mb-2 font-display text-xl font-bold text-white">No orders available</h3>
              <p className="text-slate-500">Orders marked "Ready" by restaurants will appear here automatically.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {available.map((order) => (
                <div key={order._id} className="overflow-hidden rounded-2xl"
                  style={{ background: 'rgba(10,18,40,0.85)', border: '1px solid rgba(52,211,153,0.2)', backdropFilter: 'blur(16px)' }}>

                  {/* Header */}
                  <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(52,211,153,0.06)' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📦</span>
                      <div>
                        <p className="font-bold text-white">Order #{order._id.slice(-8).toUpperCase()}</p>
                        <span className="text-xs font-bold" style={{ color: '#34d399' }}>Ready for pickup</span>
                      </div>
                    </div>
                    <p className="font-display text-xl font-black" style={{ color: '#34d399' }}>
                      ${order.totalAmount?.toFixed(2)}
                    </p>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Pickup info */}
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-3 rounded-xl p-4"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#fb7185' }}>📦 Pickup From</p>
                        <InfoRow icon="🏢" label="Restaurant" value={order.restaurant?.name} />
                        <InfoRow icon="📍" label="Address"    value={order.restaurant?.address} />
                        <InfoRow icon="🍽️" label="Category"  value={order.restaurant?.category} />
                      </div>
                      <div className="space-y-3 rounded-xl p-4"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#60a5fa' }}>🛒 Order Summary</p>
                        <InfoRow icon="📦" label="Items" value={`${order.items?.length || 0} item${order.items?.length !== 1 ? 's' : ''}`} />
                        <InfoRow icon="💰" label="Total" value={`$${order.totalAmount?.toFixed(2)}`} />
                        <InfoRow icon="🆔" label="Customer Ref" value={`#${String(order.customerId || '').slice(-8).toUpperCase()}`} />
                      </div>
                    </div>

                    {/* Items list */}
                    {order.items?.length > 0 && (
                      <div className="rounded-xl p-4"
                        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Items</p>
                        <div className="space-y-1.5">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="flex h-5 w-5 items-center justify-center rounded text-xs font-bold"
                                  style={{ background: 'rgba(251,113,133,0.15)', color: '#fb7185' }}>
                                  {item.quantity}
                                </span>
                                <span className="text-sm text-slate-300">{item.name}</span>
                              </div>
                              <span className="text-xs text-slate-500">${(item.quantity * item.unitPrice).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Claim button */}
                    <button
                      type="button"
                      disabled={claiming === order._id}
                      onClick={() => claimOrder(order._id)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all duration-200"
                      style={{
                        background: 'linear-gradient(135deg,#34d399,#059669)',
                        color: '#fff',
                        border: 'none',
                        cursor: claiming === order._id ? 'not-allowed' : 'pointer',
                        opacity: claiming === order._id ? 0.7 : 1,
                        boxShadow: '0 4px 14px rgba(52,211,153,0.35)',
                      }}
                    >
                      {claiming === order._id ? (
                        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeDashoffset="20"/>
                        </svg>
                      ) : '🏍️'}
                      {claiming === order._id ? 'Claiming…' : 'Claim This Delivery'}
                    </button>
                  </div>
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
