import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer'
  });

  const update = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form);
      }
      navigate('/restaurants');
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed');
    }
  };

  return (
    <main className="page-shell max-w-lg">
      <section className="card">
        <h1 className="font-display text-3xl">{mode === 'login' ? 'Welcome back' : 'Create account'}</h1>
        <p className="mt-1 text-sm text-slate-500">Login or register as customer or driver.</p>
        {error && <p className="mt-3 rounded bg-rose-50 p-2 text-sm text-rose-700">{error}</p>}

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              name="name"
              value={form.name}
              onChange={update}
              placeholder="Full name"
              required
            />
          )}
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            name="email"
            type="email"
            value={form.email}
            onChange={update}
            placeholder="Email"
            required
          />
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
            name="password"
            type="password"
            value={form.password}
            onChange={update}
            placeholder="Password"
            required
          />

          {mode === 'register' && (
            <select
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
              name="role"
              value={form.role}
              onChange={update}
            >
              <option value="customer">Customer</option>
              <option value="delivery_driver">Delivery Driver</option>
            </select>
          )}

          <button className="w-full rounded-lg bg-slateBrand px-4 py-2 font-semibold text-white" type="submit">
            {mode === 'login' ? 'Login' : 'Register'}
          </button>
        </form>

        <button
          type="button"
          className="mt-4 text-sm font-semibold text-coral"
          onClick={() => setMode((prev) => (prev === 'login' ? 'register' : 'login'))}
        >
          {mode === 'login' ? 'Need an account? Register' : 'Already have an account? Login'}
        </button>
      </section>
    </main>
  );
}

export default AuthPage;
