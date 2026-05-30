import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text, TouchableOpacity } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

import { auth } from './src/config/firebase';
import { DriverStackParamList, MainTabParamList, RequestsStackParamList } from './src/types';

import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import DashboardScreen from './src/screens/main/DashboardScreen';
import RequestsScreen from './src/screens/main/RequestsScreen';
import ServiceDetailScreen from './src/screens/main/ServiceDetailScreen';
import NavigationScreen from './src/screens/main/NavigationScreen';
import CompleteServiceScreen from './src/screens/main/CompleteServiceScreen';
import MapScreen from './src/screens/main/MapScreen';
import LegalScreen from './src/screens/legal/LegalScreen';

const RootStack = createNativeStackNavigator<DriverStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();
const RequestsStack = createNativeStackNavigator<RequestsStackParamList>();

function RequestsNavigator() {
  return (
    <RequestsStack.Navigator screenOptions={{ headerShown: false }}>
      <RequestsStack.Screen name="RequestsList" component={RequestsScreen} />
      <RequestsStack.Screen name="ServiceDetail" component={ServiceDetailScreen} />
      <RequestsStack.Screen name="Navigation" component={NavigationScreen} />
      <RequestsStack.Screen name="CompleteService" component={CompleteServiceScreen} />
    </RequestsStack.Navigator>
  );
}

function TabIcon({ icon, label, focused }: { icon: keyof typeof Ionicons.glyphMap; label: string; focused: boolean }) {
  return (
    <View style={{ alignItems: 'center', gap: 2 }}>
      <Ionicons name={icon} size={22} color={focused ? '#F5C518' : '#555'} />
      <Text style={{ fontSize: 9, color: focused ? '#F5C518' : '#555', fontWeight: focused ? '700' : '400' }}>
        {label}
      </Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D1B2A',
          borderTopColor: '#1C2D3E',
          height: 70,
          paddingBottom: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Requests"
        component={RequestsNavigator}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="notifications-outline" label="REQUESTS" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="map-outline" label="MAP" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Earnings"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="wallet-outline" label="EARNINGS" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon icon="person-outline" label="PROFILE" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [initialRoute, setInitialRoute] = useState<keyof DriverStackParamList | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setInitialRoute(user ? 'Main' : 'Login');
    });
    return unsub;
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0D1B2A' }}>
        <ActivityIndicator size="large" color="#F5C518" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <RootStack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="Main" component={MainTabs} />
        <RootStack.Screen name="Legal" component={LegalScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
