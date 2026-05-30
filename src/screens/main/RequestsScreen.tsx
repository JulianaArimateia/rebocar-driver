import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Animated,
  Easing,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { auth } from '../../config/firebase';
import { RequestsStackParamList, ServiceRequest, Location as LocType, TowServiceType, TOW_SERVICE_LABELS } from '../../types';
import {
  subscribeToNearbyRequests,
  subscribeToActiveRequest,
  acceptRequest,
  haversineDistance,
} from '../../services/driverService';
import { getDriverProfile } from '../../services/authService';

type Nav = NativeStackNavigationProp<RequestsStackParamList, 'RequestsList'>;

export default function RequestsScreen() {
  const navigation = useNavigation<Nav>();
  const mapRef = useRef<MapView>(null);
  const [driverLocation, setDriverLocation] = useState<LocType | null>(null);
  const [driverServiceTypes, setDriverServiceTypes] = useState<TowServiceType[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ServiceRequest[]>([]);
  const [activeRequest, setActiveRequest] = useState<ServiceRequest | null>(null);
  const [currentRequest, setCurrentRequest] = useState<ServiceRequest | null>(null);
  const [accepting, setAccepting] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (uid) {
        const profile = await getDriverProfile(uid);
        if (profile?.serviceTypes) setDriverServiceTypes(profile.serviceTypes);
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setDriverLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    })();
  }, []);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const unsub = subscribeToActiveRequest(uid, (req) => {
      setActiveRequest(req);
      if (req) navigation.navigate('ServiceDetail', { requestId: req.id });
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!driverLocation) return;
    const unsub = subscribeToNearbyRequests(driverLocation, (reqs) => {
      setPendingRequests(reqs);
      if (reqs.length > 0 && !currentRequest) {
        showRequest(reqs[0]);
      }
    }, driverServiceTypes);
    return unsub;
  }, [driverLocation, driverServiceTypes]);

  const showRequest = (req: ServiceRequest) => {
    setCurrentRequest(req);
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.back(1.2)),
      useNativeDriver: true,
    }).start();
  };

  const hideRequest = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setCurrentRequest(null));
  };

  const handleAccept = async () => {
    if (!currentRequest) return;
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setAccepting(true);
    try {
      await acceptRequest(currentRequest.id, uid);
      hideRequest();
      navigation.navigate('ServiceDetail', { requestId: currentRequest.id });
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Não foi possível aceitar a solicitação.');
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    hideRequest();
    const remaining = pendingRequests.filter((r) => r.id !== currentRequest?.id);
    if (remaining.length > 0) {
      setTimeout(() => showRequest(remaining[0]), 600);
    }
  };

  const slideY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [300, 0],
  });

  const dist = driverLocation && currentRequest?.clientLocation
    ? haversineDistance(driverLocation, currentRequest.clientLocation)
    : null;

  const eta = dist ? Math.round((dist / 40) * 60) : null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        initialRegion={
          driverLocation
            ? { ...driverLocation, latitudeDelta: 0.05, longitudeDelta: 0.05 }
            : { latitude: -5.795, longitude: -35.209, latitudeDelta: 0.05, longitudeDelta: 0.05 }
        }
      >
        {pendingRequests.map((req) => (
          <Marker
            key={req.id}
            coordinate={req.clientLocation}
            title={req.clientName}
            pinColor="#F5C518"
          />
        ))}
      </MapView>

      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.appName}>ReboCar Driver</Text>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>ONLINE</Text>
        </View>
      </View>

      {/* No active requests message */}
      {pendingRequests.length === 0 && !currentRequest && (
        <View style={styles.waitingCard}>
          <ActivityIndicator color="#F5C518" size="small" />
          <Text style={styles.waitingText}>Aguardando solicitações...</Text>
        </View>
      )}

      {/* Request notification popup */}
      {currentRequest && (
        <Animated.View style={[styles.requestCard, { transform: [{ translateY: slideY }] }]}>
          <View style={styles.requestHeader}>
            <View style={styles.newBadge}>
              <Text style={styles.newBadgeText}>NOVA SOLICITAÇÃO</Text>
            </View>
            <Text style={styles.requestPrice}>R$ {currentRequest.estimatedPrice || 145},00</Text>
          </View>
          <Text style={styles.requestType}>{TOW_SERVICE_LABELS[currentRequest.serviceType] ?? 'Guincho'}</Text>
          <Text style={styles.requestPriceLabel}>Estimativa</Text>

          <View style={styles.requestDetails}>
            <View style={styles.detailItem}>
              <Ionicons name="location-outline" size={16} color="#F5C518" />
              <Text style={styles.detailLabel}>Distância</Text>
              <Text style={styles.detailValue}>
                {dist ? `${dist.toFixed(1)} km (${eta} min)` : 'Calculando...'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="person-outline" size={16} color="#F5C518" />
              <Text style={styles.detailLabel}>Cliente</Text>
              <Text style={styles.detailValue}>{currentRequest.clientName}</Text>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
              <Text style={styles.declineBtnText}>RECUSAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptBtn, accepting && styles.acceptBtnDisabled]}
              onPress={handleAccept}
              disabled={accepting}
            >
              {accepting ? (
                <ActivityIndicator color="#1A1A2E" size="small" />
              ) : (
                <Text style={styles.acceptBtnText}>ACEITAR CHAMADO</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(39,174,96,0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 5,
    borderWidth: 1,
    borderColor: '#27AE60',
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#27AE60' },
  onlineText: { fontSize: 11, color: '#27AE60', fontWeight: '700' },
  waitingCard: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#0D1B2A',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  waitingText: { fontSize: 15, color: '#fff', fontWeight: '600' },
  requestCard: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    backgroundColor: '#0D1B2A',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 1,
    borderColor: '#F5C518',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  newBadge: {
    backgroundColor: '#F5C518',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  newBadgeText: { fontSize: 9, fontWeight: '800', color: '#1A1A2E' },
  requestPrice: { fontSize: 22, fontWeight: '800', color: '#F5C518' },
  requestType: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 2 },
  requestPriceLabel: { fontSize: 12, color: '#888', marginBottom: 16 },
  requestDetails: { flexDirection: 'row', gap: 20, marginBottom: 20 },
  detailItem: { flex: 1 },
  detailIcon: { marginBottom: 4 },
  detailLabel: { fontSize: 10, color: '#888', fontWeight: '600', marginBottom: 2 },
  detailValue: { fontSize: 13, color: '#fff', fontWeight: '600' },
  actionButtons: { flexDirection: 'row', gap: 10 },
  declineBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#FF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  declineBtnText: { fontSize: 13, color: '#FF4444', fontWeight: '700' },
  acceptBtn: {
    flex: 2,
    backgroundColor: '#F5C518',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  acceptBtnDisabled: { opacity: 0.7 },
  acceptBtnText: { fontSize: 13, color: '#1A1A2E', fontWeight: '800' },
});
