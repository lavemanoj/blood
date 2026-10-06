import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import api from '../utils/api';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const hospitalIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

const requestIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-orange.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41]
});

// Component to fly map to user location
function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, 14, { animate: true, duration: 1.5 });
  }, [position, map]);
  return null;
}

export default function MapView() {
  const [userPos, setUserPos] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);
  const [locError, setLocError] = useState(null);
  const [loading, setLoading] = useState(true);
  const watchRef = useRef(null);

  useEffect(() => {
    // Watch position for real-time updates
    if (!navigator.geolocation) {
      setLocError('Geolocation not supported by your browser');
      setLoading(false);
      return;
    }

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setUserPos([pos.coords.latitude, pos.coords.longitude]);
        setLoading(false);
      },
      (err) => {
        setLocError(`Location error: ${err.message}`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
    );

    api.get('/hospitals').then(r => setHospitals(r.data)).catch(() => {});
    api.get('/requests').then(r => setRequests(r.data.filter(r => r.status === 'pending'))).catch(() => {});

    return () => {
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current);
    };
  }, []);

  if (loading) return (
    <div style={styles.center}>
      <div style={styles.spinner} />
      <p style={{ color: 'var(--gray)', marginTop: 12 }}>Getting your location...</p>
    </div>
  );

  if (locError) return (
    <div style={styles.center}>
      <p style={{ color: 'var(--danger)' }}>⚠️ {locError}</p>
      <p style={{ color: 'var(--gray)', fontSize: 13, marginTop: 8 }}>
        Please allow location access in your browser settings.
      </p>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2>🗺️ Live Map</h2>
        <div style={styles.legend}>
          <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#2196f3' }} /> You</span>
          <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#e63946' }} /> Hospital</span>
          <span style={styles.legendItem}><span style={{ ...styles.dot, background: '#f4a261' }} /> Request</span>
        </div>
      </div>

      {userPos && (
        <div style={styles.coordBar}>
          📍 Your location: {userPos[0].toFixed(5)}, {userPos[1].toFixed(5)}
        </div>
      )}

      <MapContainer
        center={userPos || [10.6918, -61.2225]} // Default: Trinidad
        zoom={14}
        style={styles.map}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userPos && <FlyToLocation position={userPos} />}

        {/* User location */}
        {userPos && (
          <>
            <Marker position={userPos}>
              <Popup><strong>📍 You are here</strong><br />{userPos[0].toFixed(5)}, {userPos[1].toFixed(5)}</Popup>
            </Marker>
            <Circle
              center={userPos}
              radius={3000}
              pathOptions={{ color: '#2196f3', fillColor: '#2196f3', fillOpacity: 0.05, weight: 1 }}
            />
          </>
        )}

        {/* Hospitals */}
        {hospitals.map(h => {
          const coords = h.user?.location?.coordinates;
          if (!coords || (coords[0] === 0 && coords[1] === 0)) return null;
          return (
            <Marker key={h._id} position={[coords[1], coords[0]]} icon={hospitalIcon}>
              <Popup>
                <strong>🏥 {h.name}</strong><br />
                {h.address}<br />
                <small>{h.inventory?.map(i => `${i.bloodType}: ${i.units}u`).join(' | ')}</small>
              </Popup>
            </Marker>
          );
        })}

        {/* Active requests */}
        {requests.map(r => {
          const coords = r.location?.coordinates;
          if (!coords || (coords[0] === 0 && coords[1] === 0)) return null;
          return (
            <Marker key={r._id} position={[coords[1], coords[0]]} icon={requestIcon}>
              <Popup>
                <strong>🩸 {r.bloodType} needed</strong><br />
                {r.units} units — <span style={{ textTransform: 'capitalize' }}>{r.urgency}</span><br />
                {r.hospital && <span>🏥 {r.hospital}</span>}
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}

const styles = {
  container: { maxWidth: 1100, margin: '0 auto', padding: '24px 16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 },
  map: { height: '72vh', borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.12)' },
  legend: { display: 'flex', gap: 16 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: '13px' },
  dot: { width: 12, height: 12, borderRadius: '50%', display: 'inline-block' },
  coordBar: { fontSize: 13, color: 'var(--gray)', marginBottom: 10, padding: '6px 12px', background: '#f1faee', borderRadius: 6 },
  center: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh' },
  spinner: { width: 40, height: 40, border: '4px solid #eee', borderTop: '4px solid var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }
};
