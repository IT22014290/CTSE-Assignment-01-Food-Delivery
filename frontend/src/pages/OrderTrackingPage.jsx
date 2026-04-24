import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import StatusTimeline from '../components/StatusTimeline';

// Moves the map viewport whenever the driver's coordinates change
function MapPanner({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true, duration: 1 });
  }, [lat, lng]);
  return null;
}

const driverIcon = L.divIcon({
  html: `<div style="
    width: 40px; height: 40px;
    background: linear-gradient(135deg, #fb7185, #f43f5e);
    border-radius: 50% 50% 50% 0;
    transform: rotate(-45deg);
    box-shadow: 0 4px 16px rgba(251,113,133,0.6);
    display: flex; align-items: center; justify-content: center;
    border: 2px solid rgba(255,255,255,0.9);
  ">
    <span style="transform: rotate(45deg); font-size: 16px; display: block; line-height: 1; margin-top: 2px;">🏍️</span>
  </div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

function OrderTrackingPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const orderRes = await api.get(`/orders/${orderId}`);
        setOrder(orderRes.data.data);
      } catch {
        // keep last known state
      }
      try {
        const deliveryRes = await api.get(`/delivery/${orderId}`);
        setDelivery(deliveryRes.data.data);
      } catch {
        setDelivery(null);
      }
      setLastUpdated(new Date());
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (!order) {
    return (
      <main className="page-shell flex min-h-[60vh] flex-col items-center justify-center">
        <div className="mb-4 text-5xl animate-float">📍</div>
        <p className="text-slate-400">Loading your order status…</p>
      </main>
    );
  }

  const coords = delivery?.currentLocation;
  const isDelivered = order.status === 'delivered';

  return (
    <main className="page-shell">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-400">
          <span className="live-dot" />
          <span style={{ color: '#34d399' }}>Live tracking</span>
          {lastUpdated && (
            <span className="text-slate-600">· Updated {lastUpdated.toLocaleTimeString()}</span>
          )}
        </div>
        <h1 className="font-display text-4xl font-black text-white">
          {isDelivered ? 'Order Delivered! 🎉' : 'Tracking Your Order'}
        </h1>
        <p className="mt-1 text-sm text-slate-500">Order #{orderId.slice(-8).toUpperCase()}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,340px]">
        {/* ── Left column ── */}
        <div className="space-y-6">
          {/* Status timeline */}
          <StatusTimeline currentStatus={order.status} />

          {/* Map */}
          <div
            className="overflow-hidden rounded-2xl"
            style={{ border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{
                background: 'rgba(10,18,40,0.85)',
                backdropFilter: 'blur(20px)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}
            >
              <div>
                <h2 className="font-display text-lg font-bold text-white">Driver Location</h2>
                <p className="text-xs text-slate-500">Updates every 5 seconds</p>
              </div>
              {coords?.latitude && (
                <div className="flex items-center gap-2">
                  <span className="live-dot" />
                  <span className="text-xs font-semibold" style={{ color: '#34d399' }}>Live</span>
                </div>
              )}
            </div>

            {coords?.latitude && coords?.longitude ? (
              <MapContainer
                center={[coords.latitude, coords.longitude]}
                zoom={14}
                style={{ height: '360px', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapPanner lat={coords.latitude} lng={coords.longitude} />
                <Marker position={[coords.latitude, coords.longitude]} icon={driverIcon}>
                  <Popup>
                    <div style={{ fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>
                      🏍️ Your driver is here!
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            ) : (
              <div
                className="flex h-64 flex-col items-center justify-center gap-3"
                style={{ background: 'rgba(5,12,30,0.9)' }}
              >
                <span className="text-5xl opacity-30">🗺️</span>
                <p className="text-sm text-slate-500">Driver location will appear once a rider is assigned.</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: Order summary ── */}
        <div className="space-y-4">
          {/* ETA card */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: isDelivered
                ? 'linear-gradient(135deg, rgba(52,211,153,0.12), rgba(16,185,129,0.06))'
                : 'linear-gradient(135deg, rgba(251,113,133,0.1), rgba(244,63,94,0.05))',
              border: `1px solid ${isDelivered ? 'rgba(52,211,153,0.2)' : 'rgba(251,113,133,0.2)'}`,
              backdropFilter: 'blur(16px)',
            }}
          >
            <div className="mb-1 text-3xl">{isDelivered ? '🎉' : '⚡'}</div>
            <p
              className="font-display text-2xl font-black"
              style={{ color: isDelivered ? '#34d399' : '#fb7185' }}
            >
              {isDelivered ? 'Delivered!' : '~25 min'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {isDelivered ? 'Your order has been delivered. Enjoy!' : 'Estimated arrival time'}
            </p>
          </div>

          {/* Order items */}
          {order.items?.length > 0 && (
            <div
              className="rounded-2xl p-5"
              style={{
                background: 'rgba(10,18,40,0.8)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(16px)',
              }}
            >
              <h3 className="mb-4 font-display font-bold text-white">Your Order</h3>
              <div className="space-y-3">
                {order.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                        style={{ background: 'rgba(251,113,133,0.1)', color: '#fb7185' }}
                      >
                        {item.quantity}
                      </span>
                      <span className="text-sm text-slate-300">{item.name || `Item ${i + 1}`}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delivery status text */}
          <div
            className="rounded-2xl p-4"
            style={{ background: 'rgba(10,18,40,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Delivery address</p>
            <p className="text-sm text-slate-300">📍 Your current location</p>
          </div>

          {/* Back to restaurants */}
          {isDelivered && (
            <Link to="/restaurants" className="btn-primary block text-center" style={{ padding: '0.875rem' }}>
              Order Again →
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}

export default OrderTrackingPage;
