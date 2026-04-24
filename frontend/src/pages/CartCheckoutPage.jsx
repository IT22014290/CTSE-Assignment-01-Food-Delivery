import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DELIVERY_FEE = 2.99;
const SERVICE_FEE = 0.99;

function CartCheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { items, removeFromCart, clearCart, cartTotal } = useCart();
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  const subtotal = cartTotal;
  const total = subtotal + DELIVERY_FEE + SERVICE_FEE;

  const placeOrder = async () => {
    setError('');

    if (!user) {
      navigate('/auth');
      return;
    }

    if (user.role !== 'customer') {
      setError(`Only customer accounts can place orders. You are logged in as "${user.role.replace('_', ' ')}". Please log in with a customer account.`);
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    const restaurantId = items[0].restaurantId;
    if (items.some((i) => i.restaurantId !== restaurantId)) {
      setError('You can only checkout items from one restaurant at a time.');
      return;
    }

    setPlacing(true);
    try {
      const res = await api.post('/orders', {
        restaurantId,
        items: items.map((i) => ({ menuItemId: i.menuItemId, quantity: i.quantity })),
      });
      clearCart();
      navigate(`/track-order/${res.data.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please try again.');
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="page-shell flex min-h-[60vh] flex-col items-center justify-center text-center">
        <div className="mb-6 text-7xl animate-float">🛒</div>
        <h1 className="mb-2 font-display text-3xl font-black text-white">Your cart is empty</h1>
        <p className="mb-8 text-slate-400">Looks like you haven't added anything yet. Let's fix that!</p>
        <Link to="/restaurants" className="btn-primary" style={{ padding: '0.875rem 2.25rem', fontSize: '1rem' }}>
          Browse Restaurants →
        </Link>
      </main>
    );
  }

  return (
    <main className="page-shell">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/restaurants"
          className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-400 no-underline transition-colors hover:text-coral"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Continue shopping
        </Link>
        <h1 className="font-display text-4xl font-black text-white">Your Cart</h1>
        <p className="mt-1 text-slate-400">{items.length} item{items.length !== 1 ? 's' : ''} ready to order</p>
      </div>

      {/* Role warning banner */}
      {user && user.role !== 'customer' && (
        <div
          className="mb-6 flex items-start gap-3 rounded-2xl p-4 text-sm"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: '#fbbf24' }}
        >
          <span className="text-xl">⚠️</span>
          <div>
            <p className="font-bold">You are logged in as a {user.role.replace('_', ' ')}</p>
            <p className="mt-1 text-amber-300/80">
              Only <strong>customer</strong> accounts can place orders.{' '}
              <Link to="/auth" className="underline font-semibold text-amber-300">
                Sign in with a customer account →
              </Link>
            </p>
          </div>
        </div>
      )}

      {/* Not logged in warning */}
      {!user && (
        <div
          className="mb-6 flex items-start gap-3 rounded-2xl p-4 text-sm"
          style={{ background: 'rgba(96,165,250,0.1)', border: '1px solid rgba(96,165,250,0.3)', color: '#93c5fd' }}
        >
          <span className="text-xl">🔒</span>
          <div>
            <p className="font-bold">You need to sign in to place an order</p>
            <p className="mt-1">
              <Link to="/auth" className="underline font-semibold">Sign in or create an account →</Link>
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="mb-6 flex items-center gap-3 rounded-2xl p-4 text-sm"
          style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
        >
          <span>⚠️</span> {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr,380px]">
        {/* ── Cart items ── */}
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="flex items-center gap-4 rounded-2xl p-4 transition-all duration-200"
              style={{
                background: 'rgba(10,18,40,0.7)',
                border: '1px solid rgba(255,255,255,0.07)',
                backdropFilter: 'blur(16px)',
              }}
            >
              {/* Item icon */}
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl"
                style={{ background: 'rgba(251,113,133,0.1)', border: '1px solid rgba(251,113,133,0.15)' }}
              >
                🍽️
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate">{item.name}</h3>
                <p className="mt-0.5 text-sm text-slate-400">
                  ${item.price.toFixed(2)} × {item.quantity}
                </p>
              </div>

              {/* Item total */}
              <div className="text-right">
                <p className="font-display font-black text-coral">${(item.price * item.quantity).toFixed(2)}</p>
              </div>

              {/* Remove */}
              <button
                type="button"
                onClick={() => removeFromCart(item.menuItemId)}
                className="flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200 hover:bg-red-500/20 hover:text-red-400"
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', cursor: 'pointer', color: '#475569' }}
                title="Remove item"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                </svg>
              </button>
            </div>
          ))}
        </div>

        {/* ── Order summary ── */}
        <aside>
          <div
            className="sticky top-24 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(10,18,40,0.85)',
              border: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(24px)',
            }}
          >
            {/* Summary header */}
            <div
              className="px-6 py-5"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
            >
              <h2 className="font-display text-xl font-bold text-white">Order Summary</h2>
            </div>

            {/* Line items */}
            <div className="space-y-3 px-6 py-5">
              <div className="flex justify-between text-sm text-slate-400">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-200">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Delivery fee</span>
                <span className="font-semibold text-slate-200">${DELIVERY_FEE.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-slate-400">
                <span>Service fee</span>
                <span className="font-semibold text-slate-200">${SERVICE_FEE.toFixed(2)}</span>
              </div>

              <div
                className="mt-1 border-t pt-4"
                style={{ borderColor: 'rgba(255,255,255,0.07)' }}
              >
                <div className="flex justify-between">
                  <span className="font-bold text-white">Total</span>
                  <span className="gradient-text-coral font-display text-2xl font-black">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Delivery estimate */}
            <div
              className="mx-6 mb-5 flex items-center gap-3 rounded-xl p-3"
              style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)' }}
            >
              <span className="text-xl">⚡</span>
              <div>
                <p className="text-sm font-semibold" style={{ color: '#34d399' }}>Estimated delivery</p>
                <p className="text-xs text-slate-400">25–35 minutes</p>
              </div>
            </div>

            {/* Place order button */}
            <div className="px-6 pb-6">
              <button
                type="button"
                onClick={placeOrder}
                disabled={placing || (user && user.role !== 'customer')}
                className="btn-primary w-full"
                style={{ padding: '1rem', fontSize: '1rem', opacity: (placing || (user && user.role !== 'customer')) ? 0.5 : 1 }}
              >
                {placing ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="50" strokeDashoffset="20"/>
                    </svg>
                    Placing your order…
                  </span>
                ) : user && user.role !== 'customer' ? (
                  'Customer account required'
                ) : (
                  `Place Order · $${total.toFixed(2)}`
                )}
              </button>

              <p className="mt-3 text-center text-xs text-slate-500">
                By placing your order you agree to our terms of service.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default CartCheckoutPage;
