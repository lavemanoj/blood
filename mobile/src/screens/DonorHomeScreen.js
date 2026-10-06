import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRequests, acceptRequest } from '../store/requestSlice';

export default function DonorHomeScreen() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.requests);
  const { user } = useSelector(s => s.auth);

  useEffect(() => { dispatch(fetchRequests()); }, []);

  const pending = list.filter(r => ['pending','matched'].includes(r.status));

  const handleAccept = (id) => {
    Alert.alert('Accept Request', 'Are you sure you want to accept this blood request?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Accept', onPress: () => dispatch(acceptRequest(id)) }
    ]);
  };

  const openNavigation = (request) => {
    const coords = request.location?.coordinates;
    let destination = '';
    if (coords && coords[0] !== 0) {
      destination = `${coords[1]},${coords[0]}`;
    } else if (request.address) {
      destination = encodeURIComponent(request.address);
    } else if (request.hospital) {
      destination = encodeURIComponent(request.hospital);
    } else {
      Alert.alert('No location', 'This request has no location information.');
      return;
    }
    const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Google Maps'));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🩸 Nearby Requests</Text>
      <Text style={styles.sub}>Welcome, {user?.name}</Text>
      {loading && <ActivityIndicator color="#e63946" style={{ marginTop: 20 }} />}
      <FlatList
        data={pending}
        keyExtractor={item => item._id}
        ListEmptyComponent={!loading && <Text style={styles.empty}>No active requests nearby</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardLeft}>
              <View style={styles.btCircle}><Text style={styles.btText}>{item.bloodType}</Text></View>
              <View>
                <Text style={styles.units}>{item.units} unit(s) needed</Text>
                <Text style={styles.addr}>{item.address || 'Location not specified'}</Text>
                {item.hospital && <Text style={styles.addr}>🏥 {item.hospital}</Text>}
              </View>
            </View>
            <View style={styles.cardRight}>
              <View style={[styles.badge, item.urgency === 'critical' ? styles.critical : item.urgency === 'urgent' ? styles.urgent : styles.normal]}>
                <Text style={styles.badgeText}>{item.urgency}</Text>
              </View>
              {item.priorityMode && (
                <View style={[styles.badge, styles.critical, { marginTop: 4 }]}>
                  <Text style={styles.badgeText}>⚡ Priority</Text>
                </View>
              )}
              <TouchableOpacity style={styles.navBtn} onPress={() => openNavigation(item)}>
                <Text style={styles.navBtnText}>🗺️ Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.acceptBtn} onPress={() => handleAccept(item._id)}>
                <Text style={styles.acceptText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa', padding: 16, paddingTop: 50 },
  header: { fontSize: 22, fontWeight: '700', color: '#e63946', marginBottom: 4 },
  sub: { fontSize: 14, color: '#6c757d', marginBottom: 16 },
  empty: { textAlign: 'center', color: '#6c757d', marginTop: 40, fontSize: 15 },
  card: { backgroundColor: 'white', borderRadius: 10, padding: 14, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  cardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  cardRight: { alignItems: 'flex-end' },
  btCircle: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#e63946', justifyContent: 'center', alignItems: 'center' },
  btText: { color: 'white', fontWeight: '700', fontSize: 13 },
  units: { fontWeight: '600', fontSize: 14 },
  addr: { fontSize: 12, color: '#6c757d', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  critical: { backgroundColor: '#e63946' },
  urgent: { backgroundColor: '#ffe0e0' },
  normal: { backgroundColor: '#e0f0ff' },
  badgeText: { fontSize: 11, fontWeight: '600', color: 'white' },
  acceptBtn: { backgroundColor: '#e63946', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 6, marginTop: 6 },
  acceptText: { color: 'white', fontWeight: '600', fontSize: 13 },
  navBtn: { backgroundColor: '#e8f4fd', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6, marginTop: 6, borderWidth: 1, borderColor: '#90caf9' },
  navBtnText: { color: '#1565c0', fontWeight: '600', fontSize: 12 }
});
