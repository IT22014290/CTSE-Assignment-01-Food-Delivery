import { useEffect, useState } from 'react';
import api from '../services/api';
import RestaurantCard from '../components/RestaurantCard';

function RestaurantListPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      const params = {};
      if (query) params.q = query;
      if (category) params.category = category;

      const res = await api.get('/restaurants', { params });
      setRestaurants(res.data.data);
    };

    fetchRestaurants();
  }, [query, category]);

  return (
    <main className="page-shell">
      <h1 className="font-display text-3xl">Discover Restaurants</h1>
      <div className="my-5 grid gap-3 md:grid-cols-3">
        <input
          className="rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Search by name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="rounded-lg border border-slate-300 px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="">All categories</option>
          <option value="Asian">Asian</option>
          <option value="Italian">Italian</option>
          <option value="Fast Food">Fast Food</option>
          <option value="Dessert">Dessert</option>
        </select>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {restaurants.map((restaurant) => (
          <RestaurantCard key={restaurant._id} restaurant={restaurant} />
        ))}
      </section>
    </main>
  );
}

export default RestaurantListPage;
