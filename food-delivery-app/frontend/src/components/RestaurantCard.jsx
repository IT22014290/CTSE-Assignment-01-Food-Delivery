import { Link } from 'react-router-dom';

function RestaurantCard({ restaurant }) {
  return (
    <article className="card transition hover:-translate-y-1 hover:shadow-glow">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="font-display text-xl text-slateBrand">{restaurant.name}</h3>
        <span className="rounded-full bg-mint/20 px-3 py-1 text-xs font-semibold text-emerald-700">
          {restaurant.rating} ★
        </span>
      </div>
      <p className="mb-4 text-sm text-slate-600">{restaurant.description}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-700">
          {restaurant.category}
        </span>
      </div>
      <Link
        to={`/restaurants/${restaurant._id}`}
        className="inline-block rounded-lg bg-slateBrand px-4 py-2 text-sm font-semibold text-white"
      >
        View Menu
      </Link>
    </article>
  );
}

export default RestaurantCard;
