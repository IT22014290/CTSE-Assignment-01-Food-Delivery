import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="page-shell flex items-center justify-between py-4">
        <Link to="/" className="font-display text-2xl font-bold text-slateBrand">
          QuickBite
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/restaurants" className="hover:text-coral">
            Restaurants
          </Link>
          <Link to="/cart" className="hover:text-coral">
            Cart
          </Link>
          {user?.role === 'restaurant_owner' && (
            <Link to="/owner-dashboard" className="hover:text-coral">
              Owner Dashboard
            </Link>
          )}
          {user?.role === 'delivery_driver' && (
            <Link to="/driver-dashboard" className="hover:text-coral">
              Driver Dashboard
            </Link>
          )}
          {user ? (
            <button
              type="button"
              onClick={logout}
              className="rounded-full bg-slateBrand px-4 py-2 text-white"
            >
              Logout
            </button>
          ) : (
            <Link to="/auth" className="rounded-full bg-coral px-4 py-2 text-white">
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
