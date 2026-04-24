import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

function Navbar() {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const navLinks = [
    { to: '/restaurants', label: 'Restaurants' },
    ...(user?.role === 'customer' ? [{ to: '/my-orders', label: 'My Orders' }] : []),
    ...(user?.role === 'restaurant_owner' ? [{ to: '/owner-dashboard', label: 'My Restaurant' }] : []),
    ...(user?.role === 'delivery_driver' ? [{ to: '/driver-dashboard', label: 'Driver Hub' }] : []),
  ];

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'rgba(2, 8, 23, 0.82)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="page-shell flex items-center justify-between py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg font-bold"
            style={{ background: 'linear-gradient(135deg, #fb7185, #f43f5e)', boxShadow: '0 4px 14px rgba(251,113,133,0.45)' }}
          >
            🍔
          </span>
          <span className="gradient-text font-display text-xl font-black tracking-tight">QuickBite</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className="rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 no-underline"
              style={{
                color: isActive(to) ? '#fb7185' : 'rgba(148,163,184,0.9)',
                background: isActive(to) ? 'rgba(251,113,133,0.1)' : 'transparent',
              }}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Cart */}
          <Link
            to="/cart"
            className="relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 hover:bg-white/8 no-underline"
            style={{ color: isActive('/cart') ? '#fb7185' : 'rgba(148,163,184,0.8)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            {cartCount > 0 && (
              <span
                className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-black text-white"
                style={{ background: 'linear-gradient(135deg, #fb7185, #f43f5e)', fontSize: '10px', lineHeight: 1 }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>

          {/* Auth */}
          {user ? (
            <div className="hidden items-center gap-2 md:flex">
              <span
                className="hidden rounded-full px-3 py-1.5 text-xs font-semibold text-slate-300 lg:inline-block"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {user.name || user.email?.split('@')[0]}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-lg px-3 py-2 text-sm font-semibold transition-all duration-200 hover:text-red-400"
                style={{ color: 'rgba(148,163,184,0.7)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn-primary hidden py-2 text-sm md:inline-block" style={{ padding: '0.5rem 1.25rem' }}>
              Sign In
            </Link>
          )}

          {/* Mobile hamburger */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-xl md:hidden"
            style={{ background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
            onClick={() => setMenuOpen((p) => !p)}
          >
            {menuOpen ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="border-t px-4 pb-4 md:hidden"
          style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(2,8,23,0.95)' }}
        >
          <nav className="mt-3 flex flex-col gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-semibold no-underline"
                style={{ color: isActive(to) ? '#fb7185' : '#94a3b8', background: isActive(to) ? 'rgba(251,113,133,0.08)' : 'transparent' }}
              >
                {label}
              </Link>
            ))}
            {user ? (
              <button
                type="button"
                onClick={() => { logout(); setMenuOpen(false); }}
                className="mt-1 rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-red-400"
                style={{ background: 'rgba(239,68,68,0.08)', border: 'none', cursor: 'pointer' }}
              >
                Logout
              </button>
            ) : (
              <Link to="/auth" onClick={() => setMenuOpen(false)} className="btn-primary mt-2 text-center text-sm">
                Sign In
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
