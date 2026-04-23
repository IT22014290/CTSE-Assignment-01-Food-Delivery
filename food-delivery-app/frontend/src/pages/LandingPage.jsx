import { Link } from 'react-router-dom';

function LandingPage() {
  return (
    <main className="page-shell">
      <section className="grid items-center gap-8 rounded-3xl bg-gradient-to-r from-slateBrand to-slate-700 p-8 text-white md:grid-cols-2">
        <div>
          <p className="mb-2 text-sm uppercase tracking-[0.2em] text-amber-200">Fresh • Fast • Live tracking</p>
          <h1 className="font-display text-4xl leading-tight md:text-5xl">
            Your favorite meals delivered before the cravings fade.
          </h1>
          <p className="mt-4 text-slate-200">
            Explore top restaurants, place orders in seconds, and track your rider in real-time.
          </p>
          <div className="mt-6 flex gap-3">
            <Link to="/restaurants" className="rounded-full bg-coral px-5 py-3 font-semibold text-white">
              Browse Restaurants
            </Link>
            <Link to="/auth" className="rounded-full border border-white/60 px-5 py-3 font-semibold text-white">
              Get Started
            </Link>
          </div>
        </div>
        <div className="rounded-2xl bg-white/10 p-5">
          <h2 className="font-display text-2xl">Featured This Week</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-100">
            <li>Spice Garden - Sri Lankan classics</li>
            <li>Pasta Point - Handmade Italian bowls</li>
            <li>Tokyo Bento - Sushi and ramen combos</li>
          </ul>
        </div>
      </section>
    </main>
  );
}

export default LandingPage;
