import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../services/api';

function CartCheckoutPage() {
  const navigate = useNavigate();
  const { items, removeFromCart, clearCart, cartTotal } = useCart();
  const [error, setError] = useState('');

  const placeOrder = async () => {
    setError('');

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    const restaurantId = items[0].restaurantId;
    const mixedRestaurantItems = items.some((item) => item.restaurantId !== restaurantId);

    if (mixedRestaurantItems) {
      setError('Please checkout items from one restaurant at a time');
      return;
    }

    try {
      const res = await api.post('/orders', {
        restaurantId,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity
        }))
      });

      clearCart();
      navigate(`/track-order/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order');
    }
  };

  return (
    <main className="page-shell">
      <h1 className="font-display text-3xl">Cart & Checkout</h1>
      {error && <p className="mt-3 rounded bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

      <div className="mt-5 grid gap-6 lg:grid-cols-[2fr,1fr]">
        <section className="space-y-3">
          {items.map((item) => (
            <article key={item.menuItemId} className="card flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{item.name}</h3>
                <p className="text-sm text-slate-600">
                  ${item.price.toFixed(2)} x {item.quantity}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700"
                onClick={() => removeFromCart(item.menuItemId)}
              >
                Remove
              </button>
            </article>
          ))}
        </section>

        <aside className="card h-fit">
          <h2 className="font-display text-xl">Summary</h2>
          <p className="mt-3 text-slate-600">Total: ${cartTotal.toFixed(2)}</p>
          <button
            type="button"
            className="mt-4 w-full rounded-lg bg-coral px-4 py-2 font-semibold text-white"
            onClick={placeOrder}
          >
            Place Order
          </button>
        </aside>
      </div>
    </main>
  );
}

export default CartCheckoutPage;
