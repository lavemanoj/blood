import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import DonorHomeScreen from './src/screens/DonorHomeScreen';
import ChatbotScreen from './src/screens/ChatbotScreen';
import MapScreen from './src/screens/MapScreen';
import CreateRequestScreen from './src/screens/CreateRequestScreen';
import RecipientHomeScreen from './src/screens/RecipientHomeScreen';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: true })
});

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function DonorTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#e63946', headerShown: false }}>
      <Tab.Screen name="Home" component={DonorHomeScreen} options={{ tabBarLabel: '🏠 Home' }} />
      <Tab.Screen name="Chatbot" component={ChatbotScreen} options={{ tabBarLabel: '🤖 Eligibility' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: '🗺️ Map' }} />
    </Tab.Navigator>
  );
}

function RecipientTabs() {
  return (
    <Tab.Navigator screenOptions={{ tabBarActiveTintColor: '#e63946', headerShown: false }}>
      <Tab.Screen name="Home" component={RecipientHomeScreen} options={{ tabBarLabel: '🏠 Home' }} />
      <Tab.Screen name="NewRequest" component={CreateRequestScreen} options={{ tabBarLabel: '➕ Request' }} />
      <Tab.Screen name="Map" component={MapScreen} options={{ tabBarLabel: '🗺️ Map' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role, setRole] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => {
      if (t) {
        setIsLoggedIn(true);
        AsyncStorage.getItem('role').then(r => setRole(r));
      }
      setChecking(false);
    });
  }, []);

  if (checking) return null;

  return (
    <Provider store={store}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!isLoggedIn ? (
            <>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
            </>
          ) : (
            <Stack.Screen name="Main" component={role === 'donor' ? DonorTabs : RecipientTabs} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}
