import { useEffect, useState } from 'react';
import api from '../services/api';

function DriverDashboardPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [coords, setCoords] = useState({ latitude: '', longitude: '' });

  const loadDeliveries = async () => {
    const res = await api.get('/delivery/driver/active');
    setDeliveries(res.data.data);
  };

  useEffect(() => {
    loadDeliveries();
  }, []);

  const updateLocation = async (orderId, status) => {
    await api.put(`/delivery/${orderId}/location`, {
      latitude: Number(coords.latitude),
      longitude: Number(coords.longitude),
      status
    });
    await loadDeliveries();
  };

  return (
    <main className="page-shell">
      <h1 className="font-display text-3xl">Driver Dashboard</h1>

      <section className="card mt-4">
        <h2 className="font-display text-xl">Update Current GPS</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            className="rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Latitude"
            value={coords.latitude}
            onChange={(e) => setCoords((prev) => ({ ...prev, latitude: e.target.value }))}
          />
          <input
            className="rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Longitude"
            value={coords.longitude}
            onChange={(e) => setCoords((prev) => ({ ...prev, longitude: e.target.value }))}
          />
        </div>
      </section>

      <section className="mt-5 space-y-3">
        {deliveries.map((delivery) => (
          <article key={delivery._id} className="card">
            <p className="font-semibold">Order #{delivery.orderId}</p>
            <p className="text-sm text-slate-500">Status: {delivery.status}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg bg-amber-500 px-3 py-2 text-sm font-semibold text-white"
                onClick={() => updateLocation(delivery.orderId, 'picked_up')}
              >
                Mark Picked Up
              </button>
              <button
                type="button"
                className="rounded-lg bg-sky-600 px-3 py-2 text-sm font-semibold text-white"
                onClick={() => updateLocation(delivery.orderId, 'in_transit')}
              >
                In Transit
              </button>
              <button
                type="button"
                className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                onClick={() => updateLocation(delivery.orderId, 'delivered')}
              >
                Delivered
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default DriverDashboardPage;
