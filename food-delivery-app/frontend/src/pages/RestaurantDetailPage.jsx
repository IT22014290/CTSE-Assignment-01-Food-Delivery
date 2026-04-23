import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useCart } from '../context/CartContext';

function RestaurantDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [restaurantRes, menuRes] = await Promise.all([
        api.get(`/restaurants/${id}`),
        api.get(`/restaurants/${id}/menu`)
      ]);

      setRestaurant(restaurantRes.data.data);
      setMenuItems(menuRes.data.data);
    };

    fetchData();
  }, [id]);

  const groupedMenu = useMemo(() => {
    return menuItems.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [menuItems]);

  if (!restaurant) return <main className="page-shell">Loading...</main>;

  return (
    <main className="page-shell">
      <section className="card mb-6">
        <h1 className="font-display text-3xl">{restaurant.name}</h1>
        <p className="mt-2 text-slate-600">{restaurant.description}</p>
      </section>

      {Object.entries(groupedMenu).map(([category, items]) => (
        <section key={category} className="mb-6">
          <h2 className="mb-3 font-display text-xl">{category}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((item) => (
              <article key={item._id} className="card">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{item.name}</h3>
                  <span className="font-bold text-coral">${item.price.toFixed(2)}</span>
                </div>
                <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                <button
                  type="button"
                  className="mt-4 rounded-lg bg-slateBrand px-4 py-2 text-sm font-semibold text-white"
                  onClick={() =>
                    addToCart({
                      menuItemId: item._id,
                      name: item.name,
                      price: item.price,
                      restaurantId: restaurant._id
                    })
                  }
                >
                  Add to cart
                </button>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}

export default RestaurantDetailPage;
