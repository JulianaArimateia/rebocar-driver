import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { RequestsStackParamList, ServiceRequest, Location as LocType } from '../../types';
import { updateRequestStatus, updateDriverLocation, haversineDistance } from '../../services/driverService';

type Nav = NativeStackNavigationProp<RequestsStackParamList, 'Navigation'>;
type RouteProps = RouteProp<RequestsStackParamList, 'Navigation'>;

export default function NavigationScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { requestId } = route.params;
  const mapRef = useRef<MapView>(null);
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [driverLocation, setDriverLocation] = useState<LocType | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'requests', requestId), (snap) => {
      if (snap.exists()) setRequest({ id: snap.id, ...snap.data() } as ServiceRequest);
    });
    return unsub;
  }, [requestId]);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    let watcher: any;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      watcher = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (pos) => {
          const loc: LocType = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
          setDriverLocation(loc);
          if (uid) updateDriverLocation(uid, loc);
          mapRef.current?.animateToRegion({
            ...loc,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
        }
      );
    })();
    return () => watcher?.remove();
  }, []);

  const dist = driverLocation && request?.clientLocation
    ? haversineDistance(driverLocation, request.clientLocation)
    : null;
  const eta = dist ? Math.round((dist / 40) * 60) : null;

  const handleArrived = async () => {
    setLoading(true);
    try {
      await updateRequestStatus(requestId, 'arrived');
      navigation.navigate('ServiceDetail', { requestId });
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsCompass
        initialRegion={
          driverLocation
            ? { ...driverLocation, latitudeDelta: 0.015, longitudeDelta: 0.015 }
            : request?.clientLocation
            ? { ...request.clientLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 }
            : undefined
        }
      >
        {request?.clientLocation && (
          <Marker coordinate={request.clientLocation} title="Cliente" pinColor="#F5C518" />
        )}
        {driverLocation && request?.clientLocation && (
          <Polyline
            coordinates={[driverLocation, request.clientLocation]}
            strokeColor="#F5C518"
            strokeWidth={4}
          />
        )}
      </MapView>

      {/* ETA bar */}
      <View style={styles.etaBar}>
        <Text style={styles.etaDirections}>
          {dist && dist < 0.2 ? 'Chegue ao local' : 'Em navegação...'}
        </Text>
      </View>

      {/* Client info bubble */}
      {request && (
        <View style={styles.clientBubble}>
          <View style={styles.clientAvatar}>
            <Ionicons name="person" size={22} color="#1A1A2E" />
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientName}>{request.clientName}</Text>
            <Text style={styles.vehicleInfo}>
              {request.vehicleModel} • {request.vehiclePlate}
            </Text>
          </View>
          <TouchableOpacity style={styles.callBtn} onPress={() => Alert.alert('Ligar', 'Funcionalidade em breve.')}>
            <Ionicons name="call-outline" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Ionicons name="time-outline" size={20} color="#F5C518" />
            <Text style={styles.statLabel}>TEMPO</Text>
            <Text style={styles.statValue}>{eta ? `${eta} min` : '—'}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Ionicons name="location-outline" size={20} color="#F5C518" />
            <Text style={styles.statLabel}>DISTÂNCIA</Text>
            <Text style={styles.statValue}>{dist ? `${dist.toFixed(1)} km` : '—'}</Text>
          </View>
        </View>

        {request?.clientLocation && (
          <View style={styles.destinationRow}>
            <Text style={styles.destinationIcon}>|</Text>
            <Text style={styles.destinationLabel}>DESTINO</Text>
            <Text style={styles.destinationAddress} numberOfLines={1}>
              {request.destinationAddress || 'Local do cliente'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.arrivedBtn, loading && styles.arrivedBtnDisabled]}
          onPress={handleArrived}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1A1A2E" />
          ) : (
            <Text style={styles.arrivedBtnText}>CHEGUEI AO LOCAL</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  etaBar: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    backgroundColor: '#0D1B2A',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  etaDirections: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  clientBubble: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  clientAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 15, fontWeight: '700', color: '#1A1A2E' },
  vehicleInfo: { fontSize: 12, color: '#888', marginTop: 2 },
  callBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F7F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomPanel: {
    backgroundColor: '#0D1B2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 36,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#1C2D3E',
    borderRadius: 14,
    padding: 16,
  },
  statBox: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 40, backgroundColor: '#2A3D50' },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '700', letterSpacing: 1 },
  statValue: { fontSize: 18, fontWeight: '800', color: '#fff' },
  destinationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  destinationIcon: { fontSize: 18, color: '#F5C518', fontWeight: '800' },
  destinationLabel: { fontSize: 11, color: '#888', fontWeight: '700' },
  destinationAddress: { flex: 1, fontSize: 14, color: '#fff', fontWeight: '600' },
  arrivedBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  arrivedBtnDisabled: { opacity: 0.7 },
  arrivedBtnText: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
});
