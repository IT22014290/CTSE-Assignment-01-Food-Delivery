import { Link } from 'react-router-dom';

const FLOATERS = [
  { emoji: '🍕', top: '8%',  left: '5%',  size: '2.8rem', delay: '0s',   dur: '7s'  },
  { emoji: '🍔', top: '18%', left: '88%', size: '2.2rem', delay: '1s',   dur: '6s'  },
  { emoji: '🍜', top: '55%', left: '3%',  size: '2.5rem', delay: '0.5s', dur: '8s'  },
  { emoji: '🌮', top: '70%', left: '92%', size: '2rem',   delay: '1.5s', dur: '5.5s'},
  { emoji: '🍣', top: '35%', left: '94%', size: '1.8rem', delay: '2s',   dur: '7.5s'},
  { emoji: '🍰', top: '80%', left: '8%',  size: '2.3rem', delay: '0.8s', dur: '6.5s'},
  { emoji: '🥗', top: '12%', left: '45%', size: '1.6rem', delay: '2.5s', dur: '9s'  },
  { emoji: '🍛', top: '88%', left: '55%', size: '2rem',   delay: '1.2s', dur: '7s'  },
];

const CATEGORIES = [
  { emoji: '🍕', name: 'Pizza',    grad: 'rgba(249,115,22,0.18), rgba(220,38,38,0.1)' },
  { emoji: '🍔', name: 'Burgers',  grad: 'rgba(245,158,11,0.18), rgba(234,179,8,0.1)' },
  { emoji: '🍜', name: 'Asian',    grad: 'rgba(251,113,133,0.18), rgba(244,63,94,0.1)' },
  { emoji: '🌮', name: 'Mexican',  grad: 'rgba(52,211,153,0.18), rgba(16,185,129,0.1)' },
  { emoji: '🍣', name: 'Sushi',    grad: 'rgba(96,165,250,0.18), rgba(59,130,246,0.1)' },
  { emoji: '🍛', name: 'Indian',   grad: 'rgba(249,115,22,0.18), rgba(245,158,11,0.1)' },
  { emoji: '🥗', name: 'Healthy',  grad: 'rgba(52,211,153,0.18), rgba(16,185,129,0.1)' },
  { emoji: '🍰', name: 'Desserts', grad: 'rgba(168,85,247,0.18), rgba(236,72,153,0.1)' },
];

const STATS = [
  { value: '500+',   label: 'Restaurants',       icon: '🏪' },
  { value: '50k+',   label: 'Happy Customers',   icon: '😍' },
  { value: '~28min', label: 'Avg Delivery Time', icon: '⚡' },
];

function LandingPage() {
  return (
    <main className="relative overflow-x-hidden">
      {/* ── Floating food emojis ── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        {FLOATERS.map(({ emoji, top, left, size, delay, dur }) => (
          <span
            key={emoji + left}
            className="absolute select-none"
            style={{
              top, left,
              fontSize: size,
              opacity: 0.15,
              animation: `float ${dur} ease-in-out infinite`,
              animationDelay: delay,
              filter: 'blur(0.5px)',
            }}
          >
            {emoji}
          </span>
        ))}
      </div>

      <div className="page-shell relative">
        {/* ── HERO ── */}
        <section className="flex min-h-[calc(100vh-72px)] flex-col items-center justify-center py-16 text-center">
          {/* Live pill */}
          <div
            className="mb-8 inline-flex animate-fade-in items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold"
            style={{
              background: 'rgba(52,211,153,0.08)',
              border: '1px solid rgba(52,211,153,0.2)',
              color: '#34d399',
            }}
          >
            <span className="live-dot" />
            Live tracking · 500+ restaurants near you
          </div>

          {/* Headline */}
          <h1
            className="font-display font-black tracking-tight text-white animate-slide-up"
            style={{ fontSize: 'clamp(2.8rem, 8vw, 6.5rem)', lineHeight: 1.05 }}
          >
            Food that{' '}
            <span className="gradient-text">finds you.</span>
          </h1>

          <p
            className="mt-6 max-w-lg text-slate-400 animate-slide-up"
            style={{ fontSize: 'clamp(1rem, 2vw, 1.2rem)', animationDelay: '0.1s' }}
          >
            From craving to doorstep in under 30 minutes. Hundreds of restaurants, one tap away — with your rider tracked live.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/restaurants" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2.25rem' }}>
              Order Now →
            </Link>
            <Link to="/auth" className="btn-secondary" style={{ fontSize: '1rem', padding: '0.875rem 2.25rem' }}>
              Create Account
            </Link>
          </div>

          {/* Stats row */}
          <div
            className="mt-16 flex flex-wrap justify-center gap-8 md:gap-16 animate-fade-in"
            style={{ animationDelay: '0.35s' }}
          >
            {STATS.map(({ value, label, icon }) => (
              <div key={label} className="text-center">
                <div className="mb-1 text-2xl">{icon}</div>
                <p className="gradient-text-coral font-display text-3xl font-black md:text-4xl">{value}</p>
                <p className="mt-1 text-sm text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="py-16">
          <h2 className="section-title mb-2 text-center">How it works</h2>
          <p className="mb-12 text-center text-slate-500">Three steps to deliciousness</p>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { step: '01', icon: '🔍', title: 'Browse', desc: 'Explore hundreds of restaurants by cuisine, rating, or distance.' },
              { step: '02', icon: '🛒', title: 'Order', desc: 'Add your favourites to the cart and checkout in seconds.' },
              { step: '03', icon: '📍', title: 'Track Live', desc: 'Watch your rider on the map in real-time until it hits your door.' },
            ].map(({ step, icon, title, desc }) => (
              <div
                key={step}
                className="card-hover relative text-center"
                style={{ paddingTop: '2.5rem' }}
              >
                {/* Step number */}
                <span
                  className="absolute right-4 top-4 font-display text-5xl font-black opacity-[0.06]"
                  style={{ color: '#fb7185', lineHeight: 1 }}
                >
                  {step}
                </span>
                <div className="mb-4 text-5xl">{icon}</div>
                <h3 className="mb-2 font-display text-xl font-bold text-white">{title}</h3>
                <p className="text-sm text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CATEGORIES ── */}
        <section className="py-16">
          <h2 className="section-title mb-2 text-center">What are you craving?</h2>
          <p className="mb-12 text-center text-slate-500">Pick a vibe and we'll find the best spots</p>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CATEGORIES.map(({ emoji, name, grad }) => (
              <Link
                key={name}
                to="/restaurants"
                className="group flex flex-col items-center gap-3 rounded-2xl py-8 text-center no-underline transition-all duration-300"
                style={{
                  background: `linear-gradient(135deg, ${grad})`,
                  border: '1px solid rgba(255,255,255,0.07)',
                  backdropFilter: 'blur(16px)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = 'rgba(251,113,133,0.3)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = '';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
                  e.currentTarget.style.boxShadow = '';
                }}
              >
                <span
                  className="text-5xl transition-transform duration-500 group-hover:scale-125"
                  style={{ display: 'block' }}
                >
                  {emoji}
                </span>
                <span className="text-sm font-bold text-slate-200">{name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* ── CTA BANNER ── */}
        <section className="mb-16 overflow-hidden rounded-3xl py-16 text-center" style={{
          background: 'linear-gradient(135deg, rgba(251,113,133,0.12), rgba(139,92,246,0.1), rgba(52,211,153,0.08))',
          border: '1px solid rgba(251,113,133,0.15)',
        }}>
          <div className="mb-6 text-6xl">🚀</div>
          <h2 className="font-display text-3xl font-black text-white md:text-4xl">
            Ready to eat well?
          </h2>
          <p className="mt-3 text-slate-400">Join 50,000+ happy customers. Your next great meal is waiting.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/auth" className="btn-primary" style={{ fontSize: '1rem', padding: '0.875rem 2.25rem' }}>
              Get Started Free
            </Link>
            <Link to="/restaurants" className="btn-secondary" style={{ fontSize: '1rem', padding: '0.875rem 2.25rem' }}>
              Browse Restaurants
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default LandingPage;
