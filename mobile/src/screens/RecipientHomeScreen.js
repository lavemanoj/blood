import React, { useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRequests } from '../store/requestSlice';

const STATUS_COLOR = { pending: '#f4a261', matched: '#457b9d', accepted: '#2d6a4f', fulfilled: '#2d6a4f', cancelled: '#e63946' };

export default function RecipientHomeScreen() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.requests);
  const { user } = useSelector(s => s.auth);

  useEffect(() => { dispatch(fetchRequests()); }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Blood Requests</Text>
      <Text style={styles.sub}>Welcome, {user?.name}</Text>
      {loading && <ActivityIndicator color="#e63946" style={{ marginTop: 20 }} />}
      <FlatList
        data={list}
        keyExtractor={item => item._id}
        ListEmptyComponent={!loading && <Text style={styles.empty}>No requests yet. Use the + tab to create one.</Text>}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.btCircle}><Text style={styles.btText}>{item.bloodType}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.units}>{item.units} unit(s) — {item.hospital || 'No hospital'}</Text>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: STATUS_COLOR[item.status] || '#6c757d' }]}>
              <Text style={styles.statusText}>{item.status}</Text>
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
  card: { backgroundColor: 'white', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  btCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#e63946', justifyContent: 'center', alignItems: 'center' },
  btText: { color: 'white', fontWeight: '700', fontSize: 12 },
  units: { fontWeight: '600', fontSize: 14 },
  date: { fontSize: 12, color: '#6c757d', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { color: 'white', fontSize: 11, fontWeight: '600' }
});
