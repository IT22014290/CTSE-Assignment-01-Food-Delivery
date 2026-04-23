import { Link } from 'react-router-dom';

const CATEGORY_STYLES = {
  Asian:       { emoji: '🍜', grad: 'rgba(251,113,133,0.25), rgba(244,63,94,0.1)',    accent: '#fb7185' },
  Italian:     { emoji: '🍕', grad: 'rgba(249,115,22,0.25), rgba(234,88,12,0.1)',     accent: '#f97316' },
  'Fast Food': { emoji: '🍔', grad: 'rgba(245,158,11,0.25), rgba(234,179,8,0.1)',     accent: '#f59e0b' },
  Dessert:     { emoji: '🍰', grad: 'rgba(168,85,247,0.25), rgba(236,72,153,0.1)',    accent: '#a855f7' },
  Sushi:       { emoji: '🍣', grad: 'rgba(96,165,250,0.25), rgba(59,130,246,0.1)',    accent: '#60a5fa' },
  Indian:      { emoji: '🍛', grad: 'rgba(249,115,22,0.25), rgba(245,158,11,0.1)',    accent: '#f97316' },
  Mexican:     { emoji: '🌮', grad: 'rgba(52,211,153,0.25), rgba(16,185,129,0.1)',    accent: '#34d399' },
  Healthy:     { emoji: '🥗', grad: 'rgba(52,211,153,0.25), rgba(16,185,129,0.1)',    accent: '#34d399' },
  default:     { emoji: '🍽️', grad: 'rgba(148,163,184,0.15), rgba(100,116,139,0.08)', accent: '#94a3b8' },
};

function StarRating({ rating }) {
  const r = parseFloat(rating) || 4.5;
  return (
    <div className="flex items-center gap-1">
      <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>★</span>
      <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>{r.toFixed(1)}</span>
    </div>
  );
}

function RestaurantCard({ restaurant }) {
  const style = CATEGORY_STYLES[restaurant.category] || CATEGORY_STYLES.default;

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl transition-all duration-300"
      style={{
        background: 'rgba(10, 18, 40, 0.8)',
        border: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.borderColor = `${style.accent}44`;
        e.currentTarget.style.boxShadow = `0 24px 48px rgba(0,0,0,0.5), 0 0 40px ${style.accent}18`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = '';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
        e.currentTarget.style.boxShadow = '';
      }}
    >
      {/* Image / header area */}
      <div
        className="relative flex h-36 items-center justify-center overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${style.grad})` }}
      >
        {/* Big emoji */}
        <span
          className="text-7xl transition-transform duration-500 group-hover:scale-125"
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))' }}
        >
          {style.emoji}
        </span>
        {/* Rating chip */}
        <div
          className="absolute right-3 top-3 flex items-center gap-1 rounded-full px-2 py-1"
          style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(10px)' }}
        >
          <StarRating rating={restaurant.rating} />
        </div>
        {/* Shimmer on hover */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${style.accent}22 0%, transparent 70%)`,
          }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg font-bold leading-tight text-white">{restaurant.name}</h3>
        </div>

        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-400">{restaurant.description}</p>

        {/* Meta row */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ background: `${style.accent}18`, color: style.accent, border: `1px solid ${style.accent}30` }}
          >
            {restaurant.category}
          </span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">🕐 25–35 min</span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">🛵 Free delivery</span>
        </div>

        {/* CTA */}
        <Link
          to={`/restaurants/${restaurant._id}`}
          className="mt-5 block w-full rounded-xl py-2.5 text-center text-sm font-bold text-white no-underline transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${style.accent}22, ${style.accent}12)`,
            border: `1px solid ${style.accent}30`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, ${style.accent}, ${style.accent}cc)`;
            e.currentTarget.style.borderColor = 'transparent';
            e.currentTarget.style.boxShadow = `0 8px 24px ${style.accent}44`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, ${style.accent}22, ${style.accent}12)`;
            e.currentTarget.style.borderColor = `${style.accent}30`;
            e.currentTarget.style.boxShadow = '';
          }}
        >
          View Menu →
        </Link>
      </div>
    </article>
  );
}

export default RestaurantCard;
