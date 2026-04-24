import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import RestaurantListPage from './pages/RestaurantListPage';
import RestaurantDetailPage from './pages/RestaurantDetailPage';
import CartCheckoutPage from './pages/CartCheckoutPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import MyOrdersPage from './pages/MyOrdersPage';
import RestaurantDashboardPage from './pages/RestaurantDashboardPage';
import DriverDashboardPage from './pages/DriverDashboardPage';
import { useAuth } from './context/AuthContext';

function ProtectedRoute({ children, roles }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/restaurants" element={<RestaurantListPage />} />
        <Route path="/restaurants/:id" element={<RestaurantDetailPage />} />
        <Route path="/cart" element={<CartCheckoutPage />} />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute roles={['customer']}>
              <MyOrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/track-order/:orderId"
          element={
            <ProtectedRoute>
              <OrderTrackingPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/owner-dashboard"
          element={
            <ProtectedRoute roles={['restaurant_owner']}>
              <RestaurantDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/driver-dashboard"
          element={
            <ProtectedRoute roles={['delivery_driver']}>
              <DriverDashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;
