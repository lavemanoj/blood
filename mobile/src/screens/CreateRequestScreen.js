import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import api from '../utils/api';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function CreateRequestScreen() {
  const [form, setForm] = useState({ bloodType: 'O+', units: '1', urgency: 'normal', priorityMode: false, address: '', hospital: '', notes: '' });
  const [coords, setCoords] = useState(null);
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission denied'); return; }
    const loc = await Location.getCurrentPositionAsync({});
    setCoords([loc.coords.longitude, loc.coords.latitude]);
    Alert.alert('Location captured');
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/requests', {
        ...form,
        units: parseInt(form.units),
        location: coords ? { type: 'Point', coordinates: coords } : undefined
      });
      Alert.alert('Success', 'Blood request submitted! Matching donors...');
      setForm({ bloodType: 'O+', units: '1', urgency: 'normal', priorityMode: false, address: '', hospital: '', notes: '' });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🩸 New Blood Request</Text>

      <Text style={styles.label}>Blood Type</Text>
      <View style={styles.btRow}>
        {BLOOD_TYPES.map(bt => (
          <TouchableOpacity key={bt} style={[styles.btBtn, form.bloodType === bt && styles.btActive]} onPress={() => set('bloodType', bt)}>
            <Text style={[styles.btText, form.bloodType === bt && { color: 'white' }]}>{bt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Units Needed</Text>
      <TextInput style={styles.input} value={form.units} onChangeText={v => set('units', v)} keyboardType="numeric" />

      <Text style={styles.label}>Urgency</Text>
      <View style={styles.urgencyRow}>
        {['normal','urgent','critical'].map(u => (
          <TouchableOpacity key={u} style={[styles.urgBtn, form.urgency === u && styles.urgActive]} onPress={() => set('urgency', u)}>
            <Text style={[styles.urgText, form.urgency === u && { color: 'white' }]}>{u}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Hospital name" value={form.hospital} onChangeText={v => set('hospital', v)} />
      <TextInput style={styles.input} placeholder="Address" value={form.address} onChangeText={v => set('address', v)} />
      <TextInput style={[styles.input, { height: 80 }]} placeholder="Notes..." value={form.notes} onChangeText={v => set('notes', v)} multiline />

      <TouchableOpacity style={[styles.priorityRow, form.priorityMode && styles.priorityActive]} onPress={() => set('priorityMode', !form.priorityMode)}>
        <Text style={styles.priorityText}>{form.priorityMode ? '⚡ Priority Mode ON' : '⚡ Enable Priority Mode'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.locBtn} onPress={getLocation}>
        <Text style={styles.locText}>{coords ? '📍 Location captured' : '📍 Use my location'}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.btn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Submit Request</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 50, backgroundColor: '#fff' },
  title: { fontSize: 22, fontWeight: '700', color: '#e63946', marginBottom: 20 },
  label: { fontWeight: '600', marginBottom: 8, color: '#1d3557' },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 15 },
  btRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  btBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: '#dee2e6', borderRadius: 6 },
  btActive: { borderColor: '#e63946', backgroundColor: '#e63946' },
  btText: { fontWeight: '600' },
  urgencyRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  urgBtn: { flex: 1, padding: 10, borderWidth: 2, borderColor: '#dee2e6', borderRadius: 8, alignItems: 'center' },
  urgActive: { borderColor: '#e63946', backgroundColor: '#e63946' },
  urgText: { fontWeight: '600', textTransform: 'capitalize' },
  priorityRow: { backgroundColor: '#fff3cd', padding: 14, borderRadius: 8, marginBottom: 12, alignItems: 'center' },
  priorityActive: { backgroundColor: '#e63946' },
  priorityText: { fontWeight: '600', color: '#856404' },
  locBtn: { borderWidth: 2, borderColor: '#e63946', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  locText: { color: '#e63946', fontWeight: '600' },
  btn: { backgroundColor: '#e63946', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 30 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 16 }
});
