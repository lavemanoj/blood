import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../utils/api';

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'donor', bloodType: 'O+', age: '', weight: '' });
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      await AsyncStorage.setItem('token', data.token);
      await AsyncStorage.setItem('role', data.user.role);
      Alert.alert('Success', 'Account created!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🩸 Create Account</Text>
      <TextInput style={styles.input} placeholder="Full Name" value={form.name} onChangeText={v => set('name', v)} />
      <TextInput style={styles.input} placeholder="Email" value={form.email} onChangeText={v => set('email', v)} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Phone" value={form.phone} onChangeText={v => set('phone', v)} keyboardType="phone-pad" />
      <TextInput style={styles.input} placeholder="Password" value={form.password} onChangeText={v => set('password', v)} secureTextEntry />

      <Text style={styles.label}>Role</Text>
      <View style={styles.roleRow}>
        {['donor','recipient'].map(r => (
          <TouchableOpacity key={r} style={[styles.roleBtn, form.role === r && styles.roleBtnActive]} onPress={() => set('role', r)}>
            <Text style={[styles.roleBtnText, form.role === r && { color: 'white' }]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {form.role === 'donor' && (
        <>
          <Text style={styles.label}>Blood Type</Text>
          <View style={styles.btRow}>
            {BLOOD_TYPES.map(bt => (
              <TouchableOpacity key={bt} style={[styles.btBtn, form.bloodType === bt && styles.btBtnActive]} onPress={() => set('bloodType', bt)}>
                <Text style={[styles.btBtnText, form.bloodType === bt && { color: 'white' }]}>{bt}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={styles.input} placeholder="Age" value={form.age} onChangeText={v => set('age', v)} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Weight (kg)" value={form.weight} onChangeText={v => set('weight', v)} keyboardType="numeric" />
        </>
      )}

      <TouchableOpacity style={styles.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Create Account</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 50, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: '700', color: '#e63946', textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 15 },
  label: { fontWeight: '600', marginBottom: 8, color: '#1d3557' },
  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleBtn: { flex: 1, padding: 12, borderWidth: 2, borderColor: '#dee2e6', borderRadius: 8, alignItems: 'center' },
  roleBtnActive: { borderColor: '#e63946', backgroundColor: '#e63946' },
  roleBtnText: { fontWeight: '600', textTransform: 'capitalize' },
  btRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  btBtn: { paddingHorizontal: 12, paddingVertical: 8, borderWidth: 2, borderColor: '#dee2e6', borderRadius: 6 },
  btBtnActive: { borderColor: '#e63946', backgroundColor: '#e63946' },
  btBtnText: { fontWeight: '600' },
  btn: { backgroundColor: '#e63946', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', color: '#e63946', fontSize: 14 }
});
