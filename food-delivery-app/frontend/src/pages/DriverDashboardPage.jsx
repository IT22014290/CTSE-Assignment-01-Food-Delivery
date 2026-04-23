import { useEffect, useState } from 'react';
import api from '../services/api';

const DELIVERY_STATUS_CONFIG = {
  pending:    { icon: '🕐', label: 'Pending',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',    border: 'rgba(245,158,11,0.2)'  },
  picked_up:  { icon: '🏍️', label: 'Picked Up', color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',    border: 'rgba(96,165,250,0.2)'  },
  in_transit: { icon: '📍', label: 'In Transit', color: '#a855f7', bg: 'rgba(168,85,247,0.1)',   border: 'rgba(168,85,247,0.2)'  },
  delivered:  { icon: '✅', label: 'Delivered',  color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.2)'  },
};

function DriverDashboardPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [coords, setCoords] = useState({ latitude: '', longitude: '' });
  const [updating, setUpdating] = useState(null);
  const [autoGps, setAutoGps] = useState(false);

  const loadDeliveries = async () => {
    const res = await api.get('/delivery/driver/active');
    setDeliveries(res.data.data);
  };

  useEffect(() => { loadDeliveries(); }, []);

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

  const updateLocation = async (orderId, status) => {
    setUpdating(orderId + status);
    await api.put(`/delivery/${orderId}/location`, {
      latitude: Number(coords.latitude),
      longitude: Number(coords.longitude),
      status,
    });
    await loadDeliveries();
    setUpdating(null);
  };

  const activeCount = deliveries.filter((d) => d.status !== 'delivered').length;

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
              : 'No active deliveries'}
          </p>
        </div>

        {/* Online indicator */}
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
          <div
            key={label}
            className="rounded-2xl p-5 text-center"
            style={{
              background: 'rgba(10,18,40,0.8)',
              border: '1px solid rgba(255,255,255,0.07)',
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="mb-2 text-2xl">{icon}</div>
            <p className="font-display text-3xl font-black" style={{ color }}>{value}</p>
            <p className="mt-1 text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* ── GPS panel ── */}
      <div
        className="mb-8 rounded-2xl p-6"
        style={{
          background: 'rgba(10,18,40,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
        }}
      >
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
            ) : (
              '🎯 Auto-detect'
            )}
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Latitude</label>
            <input
              className="input-field"
              placeholder="e.g. 6.9271"
              value={coords.latitude}
              onChange={(e) => setCoords((p) => ({ ...p, latitude: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">Longitude</label>
            <input
              className="input-field"
              placeholder="e.g. 79.8612"
              value={coords.longitude}
              onChange={(e) => setCoords((p) => ({ ...p, longitude: e.target.value }))}
            />
          </div>
        </div>

        {coords.latitude && coords.longitude && (
          <p className="mt-3 text-xs text-slate-500">
            📌 Current: {Number(coords.latitude).toFixed(4)}, {Number(coords.longitude).toFixed(4)}
          </p>
        )}
      </div>

      {/* ── Active deliveries ── */}
      <div>
        <h2 className="mb-4 font-display text-2xl font-bold text-white">Active Deliveries</h2>

        {deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl py-20 text-center"
            style={{ background: 'rgba(10,18,40,0.5)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="mb-4 text-5xl">🏍️</span>
            <h3 className="mb-2 font-display text-xl font-bold text-white">Ready to ride!</h3>
            <p className="text-slate-500">Deliveries assigned to you will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery) => {
              const config = DELIVERY_STATUS_CONFIG[delivery.status] || DELIVERY_STATUS_CONFIG.pending;
              return (
                <div
                  key={delivery._id}
                  className="overflow-hidden rounded-2xl"
                  style={{
                    background: 'rgba(10,18,40,0.8)',
                    border: `1px solid ${config.border}`,
                    backdropFilter: 'blur(16px)',
                  }}
                >
                  {/* Header */}
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
                        <span
                          className="text-xs font-bold uppercase tracking-wider"
                          style={{ color: config.color }}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
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
                        style={{
                          background: bg,
                          border: `1px solid ${border}`,
                          color,
                          cursor: 'pointer',
                          opacity: updating === delivery.orderId + status ? 0.6 : 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 6px 20px ${color}33`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = '';
                          e.currentTarget.style.boxShadow = '';
                        }}
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
    </main>
  );
}

export default DriverDashboardPage;
