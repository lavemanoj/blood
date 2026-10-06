import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../store/authSlice';

export default function LoginScreen({ navigation }) {
  const dispatch = useDispatch();
  const { loading, error } = useSelector(s => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const result = await dispatch(login({ email, password }));
    if (!result.error) {
      // App.js will re-render based on AsyncStorage
      Alert.alert('Success', 'Logged in successfully');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🩸</Text>
      <Text style={styles.title}>Hemora</Text>
      <Text style={styles.subtitle}>AI-Powered Emergency Blood Donor Matching</Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput style={styles.input} placeholder="Email" value={email}
        onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={styles.input} placeholder="Password" value={password}
        onChangeText={setPassword} secureTextEntry />
      <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="white" /> : <Text style={styles.btnText}>Sign In</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  logo: { fontSize: 64, textAlign: 'center', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', color: '#e63946' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#6c757d', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#dee2e6', borderRadius: 8, padding: 14, marginBottom: 12, fontSize: 15 },
  btn: { backgroundColor: '#e63946', padding: 16, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  btnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  link: { textAlign: 'center', color: '#e63946', fontSize: 14 },
  error: { color: '#e63946', textAlign: 'center', marginBottom: 12, fontSize: 14 }
});
