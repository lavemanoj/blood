import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../utils/api';

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc.coords);
      }
    })();
    api.get('/hospitals').then(r => setHospitals(r.data)).catch(() => {});
    api.get('/requests').then(r => setRequests(r.data.filter(r => r.status === 'pending'))).catch(() => {});
  }, []);

  if (!location) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#e63946" />
      <Text style={{ marginTop: 12, color: '#6c757d' }}>Getting your location...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <MapView style={styles.map}
        initialRegion={{ latitude: location.latitude, longitude: location.longitude, latitudeDelta: 0.1, longitudeDelta: 0.1 }}>
        <Marker coordinate={{ latitude: location.latitude, longitude: location.longitude }}
          title="You" pinColor="blue" />
        <Circle center={{ latitude: location.latitude, longitude: location.longitude }}
          radius={5000} strokeColor="rgba(33,150,243,0.3)" fillColor="rgba(33,150,243,0.05)" />

        {hospitals.map(h => {
          const c = h.user?.location?.coordinates;
          if (!c || c[0] === 0) return null;
          return (
            <Marker key={h._id} coordinate={{ latitude: c[1], longitude: c[0] }}
              title={h.name} description={h.address} pinColor="red" />
          );
        })}

        {requests.map(r => {
          const c = r.location?.coordinates;
          if (!c || c[0] === 0) return null;
          return (
            <Marker key={r._id} coordinate={{ latitude: c[1], longitude: c[0] }}
              title={`${r.bloodType} needed`} description={`${r.units} units — ${r.urgency}`} pinColor="orange" />
          );
        })}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
