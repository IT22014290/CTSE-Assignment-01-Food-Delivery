import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const STATUS_CONFIG = {
  pending:   { label: 'Pending',    color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.2)',  icon: '🕐' },
  confirmed: { label: 'Confirmed',  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)',  icon: '✅' },
  preparing: { label: 'Preparing',  color: '#a855f7', bg: 'rgba(168,85,247,0.1)',  border: 'rgba(168,85,247,0.2)',  icon: '👨‍🍳' },
  ready:     { label: 'Ready',      color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',  icon: '📦' },
  picked_up: { label: 'Picked Up',  color: '#60a5fa', bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.2)',  icon: '🏍️' },
  delivered: { label: 'Delivered',  color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.2)',  icon: '🎉' },
};

function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await api.get('/orders');
        setOrders(res.data.data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
    const interval = setInterval(fetchOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const cardStyle = {
    background: 'rgba(10,18,40,0.8)',
    border: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(20px)',
  };

  return (
    <main className="page-shell">
      <div className="mb-8">
        <p className="mb-1 text-sm font-semibold uppercase tracking-widest" style={{ color: '#fb7185' }}>Customer</p>
        <h1 className="font-display text-4xl font-black text-white">My Orders</h1>
        <p className="mt-1 text-slate-400">Track all your orders in real time</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl p-5" style={cardStyle}>
              <div className="skeleton h-5 w-1/3 mb-3" />
              <div className="skeleton h-4 w-1/4" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl py-24 text-center"
          style={cardStyle}
        >
          <span className="mb-4 text-6xl">🛒</span>
          <h3 className="mb-2 font-display text-2xl font-bold text-white">No orders yet</h3>
          <p className="mb-6 text-slate-400">Hungry? Browse restaurants and place your first order.</p>
          <Link to="/restaurants" className="btn-primary" style={{ padding: '0.875rem 2rem' }}>
            Browse Restaurants →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
            const isActive = !['delivered'].includes(order.status);
            return (
              <div
                key={order._id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl p-5 transition-all duration-200"
                style={{ background: 'rgba(10,18,40,0.8)', border: `1px solid ${cfg.border}`, backdropFilter: 'blur(16px)' }}
              >
                {/* Left: order info */}
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
                  >
                    {cfg.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      Order #{order._id.slice(-8).toUpperCase()}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-400">
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} · ${order.totalAmount?.toFixed(2)}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Right: status + track button */}
                <div className="flex items-center gap-3">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider"
                    style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
                  >
                    {cfg.label}
                  </span>
                  <Link
                    to={`/track-order/${order._id}`}
                    className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-bold no-underline transition-all duration-200"
                    style={
                      isActive
                        ? { background: 'linear-gradient(135deg, #fb7185, #f43f5e)', color: '#fff', boxShadow: '0 4px 14px rgba(251,113,133,0.4)' }
                        : { background: 'rgba(255,255,255,0.07)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }
                    }
                  >
                    {isActive ? (
                      <>
                        <span className="live-dot" style={{ background: '#fff' }} />
                        Track Live
                      </>
                    ) : 'View Details'}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

export default MyOrdersPage;
