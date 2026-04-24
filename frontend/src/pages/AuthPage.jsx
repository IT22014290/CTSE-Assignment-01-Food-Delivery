import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_OPTIONS = [
  {
    value: 'customer',
    icon: '🛍️',
    title: 'Customer',
    desc: 'Order food from nearby restaurants',
  },
  {
    value: 'restaurant_owner',
    icon: '🍽️',
    title: 'Restaurant Owner',
    desc: 'Manage your restaurant and menu',
  },
  {
    value: 'delivery_driver',
    icon: '🏍️',
    title: 'Delivery Driver',
    desc: 'Deliver orders and earn money',
  },
];

function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'customer' });

  const update = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let result;
      if (mode === 'login') {
        result = await login(form.email, form.password);
      } else {
        result = await register(form);
      }
      const role = result?.data?.user?.role;
      if (role === 'restaurant_owner') navigate('/owner-dashboard');
      else if (role === 'delivery_driver') navigate('/driver-dashboard');
      else navigate('/restaurants');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-12"
    >
      {/* Background blobs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -left-40 top-20 h-80 w-80 rounded-full opacity-20"
          style={{ background: 'radial-gradient(circle, rgba(251,113,133,0.6) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
        <div
          className="absolute -right-40 bottom-20 h-96 w-96 rounded-full opacity-15"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.6) 0%, transparent 70%)', filter: 'blur(50px)' }}
        />
      </div>

      <div className="relative w-full max-w-md animate-scale-in">
        {/* Gradient border wrapper */}
        <div
          className="p-px rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(251,113,133,0.4) 0%, rgba(52,211,153,0.15) 50%, rgba(139,92,246,0.3) 100%)',
          }}
        >
          <div
            className="rounded-2xl p-8"
            style={{ background: 'rgba(5, 12, 30, 0.92)', backdropFilter: 'blur(30px)' }}
          >
            {/* Logo */}
            <div className="mb-8 flex justify-center">
              <Link to="/" className="flex items-center gap-2 no-underline">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-xl"
                  style={{ background: 'linear-gradient(135deg, #fb7185, #f43f5e)', boxShadow: '0 4px 14px rgba(251,113,133,0.45)' }}
                >
                  🍔
                </span>
                <span className="gradient-text font-display text-2xl font-black">QuickBite</span>
              </Link>
            </div>

            {/* Mode tabs */}
            <div
              className="mb-8 flex rounded-xl p-1"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              {[
                { key: 'login', label: 'Sign In' },
                { key: 'register', label: 'Register' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => { setMode(key); setError(''); }}
                  className="flex-1 rounded-lg py-2.5 text-sm font-bold transition-all duration-300"
                  style={
                    mode === key
                      ? {
                          background: 'linear-gradient(135deg, #fb7185, #f43f5e)',
                          color: '#fff',
                          boxShadow: '0 4px 14px rgba(251,113,133,0.4)',
                          border: 'none',
                          cursor: 'pointer',
                        }
                      : { background: 'transparent', color: '#64748b', border: 'none', cursor: 'pointer' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            <h1 className="mb-1 font-display text-2xl font-black text-white">
              {mode === 'login' ? 'Welcome back 👋' : 'Create your account'}
            </h1>
            <p className="mb-6 text-sm text-slate-500">
              {mode === 'login'
                ? 'Sign in to order your favourite meals.'
                : 'Join thousands of food lovers today.'}
            </p>

            {/* Error */}
            {error && (
              <div
                className="mb-5 flex items-center gap-2 rounded-xl p-3 text-sm"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5' }}
              >
                <span>⚠️</span> {error}
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* Name (register only) */}
              {mode === 'register' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Full Name
                  </label>
                  <input
                    className="input-field"
                    name="name"
                    value={form.name}
                    onChange={update}
                    placeholder="John Doe"
                    required
                  />
                </div>
              )}

              {/* Email */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Email
                </label>
                <input
                  className="input-field"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={update}
                  placeholder="you@example.com"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Password
                </label>
                <input
                  className="input-field"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={update}
                  placeholder="••••••••"
                  required
                />
              </div>

              {/* Role selector (register only) */}
              {mode === 'register' && (
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                    I want to…
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {ROLE_OPTIONS.map(({ value, icon, title, desc }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, role: value }))}
                        className="rounded-xl p-3 text-left transition-all duration-200"
                        style={
                          form.role === value
                            ? {
                                background: 'rgba(251,113,133,0.12)',
                                border: '1.5px solid rgba(251,113,133,0.5)',
                                cursor: 'pointer',
                              }
                            : {
                                background: 'rgba(255,255,255,0.04)',
                                border: '1.5px solid rgba(255,255,255,0.08)',
                                cursor: 'pointer',
                              }
                        }
                      >
                        <div className="mb-1 text-2xl">{icon}</div>
                        <div
                          className="text-sm font-bold"
                          style={{ color: form.role === value ? '#fb7185' : '#e2e8f0' }}
                        >
                          {title}
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">{desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
                style={{ marginTop: '0.5rem', padding: '0.875rem', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="50" strokeDashoffset="20"/>
                    </svg>
                    Please wait…
                  </span>
                ) : mode === 'login' ? 'Sign In →' : 'Create Account →'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AuthPage;
