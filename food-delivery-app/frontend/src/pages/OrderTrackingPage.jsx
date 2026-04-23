import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../services/api';
import StatusTimeline from '../components/StatusTimeline';

const markerIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function OrderTrackingPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [delivery, setDelivery] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const orderRes = await api.get(`/orders/${orderId}`);
      setOrder(orderRes.data.data);

      try {
        const deliveryRes = await api.get(`/delivery/${orderId}`);
        setDelivery(deliveryRes.data.data);
      } catch (error) {
        setDelivery(null);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (!order) return <main className="page-shell">Loading order status...</main>;

  const coords = delivery?.currentLocation;

  return (
    <main className="page-shell space-y-5">
      <h1 className="font-display text-3xl">Track Your Order</h1>
      <StatusTimeline currentStatus={order.status} />

      <section className="card">
        <h2 className="mb-3 font-display text-xl">Driver Location</h2>
        {coords?.latitude && coords?.longitude ? (
          <MapContainer center={[coords.latitude, coords.longitude]} zoom={14} className="h-80 w-full rounded-xl">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[coords.latitude, coords.longitude]} icon={markerIcon}>
              <Popup>Driver current location</Popup>
            </Marker>
          </MapContainer>
        ) : (
          <p className="text-sm text-slate-500">Driver location will appear once updates start.</p>
        )}
      </section>
    </main>
  );
}

export default OrderTrackingPage;
