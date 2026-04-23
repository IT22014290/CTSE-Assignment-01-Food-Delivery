import { useEffect, useState } from 'react';
import api from '../services/api';

function RestaurantDashboardPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [selected, setSelected] = useState('');
  const [orders, setOrders] = useState([]);
  const [menuForm, setMenuForm] = useState({ name: '', category: '', price: '', description: '' });

  useEffect(() => {
    const loadRestaurants = async () => {
      const res = await api.get('/restaurants');
      setRestaurants(res.data.data);
      if (res.data.data.length > 0) setSelected(res.data.data[0]._id);
    };

    loadRestaurants();
  }, []);

  useEffect(() => {
    const loadOrders = async () => {
      if (!selected) return;
      const res = await api.get(`/orders/restaurant/${selected}`);
      setOrders(res.data.data);
    };

    loadOrders();
  }, [selected]);

  const addMenuItem = async (e) => {
    e.preventDefault();
    if (!selected) return;
    await api.post(`/restaurants/${selected}/menu`, {
      ...menuForm,
      price: Number(menuForm.price)
    });
    setMenuForm({ name: '', category: '', price: '', description: '' });
  };

  const updateOrderStatus = async (orderId, status) => {
    await api.put(`/orders/${orderId}/status`, { status });
    const refreshed = await api.get(`/orders/restaurant/${selected}`);
    setOrders(refreshed.data.data);
  };

  return (
    <main className="page-shell grid gap-6 lg:grid-cols-2">
      <section className="card">
        <h1 className="font-display text-2xl">Restaurant Dashboard</h1>
        <select
          className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
        >
          {restaurants.map((r) => (
            <option key={r._id} value={r._id}>
              {r.name}
            </option>
          ))}
        </select>

        <form className="mt-4 space-y-3" onSubmit={addMenuItem}>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Item name"
            value={menuForm.name}
            onChange={(e) => setMenuForm((prev) => ({ ...prev, name: e.target.value }))}
            required
          />
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Category"
            value={menuForm.category}
            onChange={(e) => setMenuForm((prev) => ({ ...prev, category: e.target.value }))}
            required
          />
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Price"
            type="number"
            step="0.01"
            value={menuForm.price}
            onChange={(e) => setMenuForm((prev) => ({ ...prev, price: e.target.value }))}
            required
          />
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Description"
            value={menuForm.description}
            onChange={(e) => setMenuForm((prev) => ({ ...prev, description: e.target.value }))}
          />
          <button className="rounded-lg bg-slateBrand px-4 py-2 text-white" type="submit">
            Add Menu Item
          </button>
        </form>
      </section>

      <section className="card">
        <h2 className="font-display text-2xl">Incoming Orders</h2>
        <div className="mt-4 space-y-3">
          {orders.map((order) => (
            <article key={order._id} className="rounded-lg border border-slate-200 p-3">
              <p className="text-sm font-semibold">Order #{order._id.slice(-6)}</p>
              <p className="text-sm text-slate-500">Status: {order.status}</p>
              <select
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
                value={order.status}
                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
              >
                <option value="pending">pending</option>
                <option value="confirmed">confirmed</option>
                <option value="preparing">preparing</option>
                <option value="ready">ready</option>
              </select>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

export default RestaurantDashboardPage;
