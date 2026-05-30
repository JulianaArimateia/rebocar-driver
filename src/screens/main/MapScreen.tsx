import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { auth } from '../../config/firebase';
import { updateDriverLocation } from '../../services/driverService';
import { Location as LocType } from '../../types';

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [location, setLocation] = useState<LocType | null>(null);

  useEffect(() => {
    let watcher: any;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000 },
        (pos) => {
          const loc: LocType = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setLocation(loc);
          const uid = auth.currentUser?.uid;
          if (uid) updateDriverLocation(uid, loc);
        }
      );
    })();
    return () => watcher?.remove();
  }, []);

  const centerOnUser = () => {
    if (location) {
      mapRef.current?.animateToRegion({
        ...location,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={
          location
            ? { ...location, latitudeDelta: 0.02, longitudeDelta: 0.02 }
            : { latitude: -5.795, longitude: -35.209, latitudeDelta: 0.05, longitudeDelta: 0.05 }
        }
      >
        {location && (
          <Marker coordinate={location} title="Você está aqui">
            <View style={styles.driverMarker}>
              <Ionicons name="car-sport" size={22} color="#1A1A2E" />
            </View>
          </Marker>
        )}
      </MapView>

      <TouchableOpacity style={styles.centerBtn} onPress={centerOnUser}>
        <Ionicons name="locate-outline" size={22} color="#F5C518" />
      </TouchableOpacity>

      <View style={styles.overlay}>
        <Text style={styles.overlayText}>Mapa em tempo real</Text>
        <Text style={styles.overlaySubtext}>
          {location
            ? `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
            : 'Obtendo localização...'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  driverMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  centerBtn: {
    position: 'absolute',
    bottom: 100,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D1B2A',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  overlay: {
    position: 'absolute',
    top: 50,
    left: 16,
    backgroundColor: 'rgba(13,27,42,0.85)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  overlayText: { color: '#fff', fontSize: 13, fontWeight: '700', marginBottom: 2 },
  overlaySubtext: { color: '#888', fontSize: 11 },
});
