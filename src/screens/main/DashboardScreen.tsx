import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Switch,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { auth } from '../../config/firebase';
import { getDriverProfile } from '../../services/authService';
import { updateDriverStatus, updateDriverLocation, getDriverEarnings, getDriverHistory } from '../../services/driverService';
import { ServiceRequest } from '../../types';

const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'HOJ', 'SAB', 'DOM'];

const formatCurrency = (val: number) =>
  val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatDate = (timestamp: any): string => {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return date.toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export default function DashboardScreen() {
  const [driverName, setDriverName] = useState('Parceiro');
  const [isOnline, setIsOnline] = useState(false);
  const [earnings, setEarnings] = useState({ week: 0, total: 0, services: 0 });
  const [recentServices, setRecentServices] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);

  let locationWatcher: any = null;

  const loadData = useCallback(async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const [profile, earningsData, history] = await Promise.all([
      getDriverProfile(uid),
      getDriverEarnings(uid),
      getDriverHistory(uid),
    ]);

    if (profile) {
      setDriverName(profile.name);
      setIsOnline(profile.status === 'available');
    }
    setEarnings(earningsData);
    setRecentServices(history.slice(0, 5));
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleToggleOnline = async (value: boolean) => {
    setTogglingStatus(true);
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const newStatus = value ? 'available' : 'offline';
    await updateDriverStatus(uid, newStatus);
    setIsOnline(value);

    if (value) {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        locationWatcher = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
          (pos) => {
            updateDriverLocation(uid, {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          }
        );
      }
    } else {
      locationWatcher?.remove();
    }

    setTogglingStatus(false);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5C518" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#F5C518" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={24} color="#1A1A2E" />
          </View>
          {isOnline && <View style={styles.onlineDot} />}
        </View>
        <Text style={styles.appTitle}>REBOCAR DRIVER</Text>
        <View style={[styles.statusBadge, isOnline ? styles.statusOnline : styles.statusOffline]}>
          <View style={[styles.statusDot, isOnline ? styles.dotOnline : styles.dotOffline]} />
          <Text style={[styles.statusText, isOnline ? styles.statusTextOnline : styles.statusTextOffline]}>
            {isOnline ? 'ONLINE' : 'OFFLINE'}
          </Text>
        </View>
      </View>

      {/* Online toggle */}
      <View style={styles.toggleCard}>
        <Text style={styles.toggleLabel}>{isOnline ? 'Você está online' : 'Você está offline'}</Text>
        <Switch
          value={isOnline}
          onValueChange={handleToggleOnline}
          trackColor={{ false: '#2A3D50', true: 'rgba(245,197,24,0.3)' }}
          thumbColor={isOnline ? '#F5C518' : '#888'}
          disabled={togglingStatus}
        />
      </View>

      {/* Earnings card */}
      <View style={styles.earningsCard}>
        <Text style={styles.earningsLabel}>SALDO TOTAL DA SEMANA</Text>
        <Text style={styles.earningsValue}>{formatCurrency(earnings.week)}</Text>
        <View style={styles.earningsGrowth}>
          <Text style={styles.growthText}>Total acumulado: {formatCurrency(earnings.total)}</Text>
        </View>
      </View>

      {/* Performance */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Desempenho Diário</Text>
          <Text style={styles.cardSubtitle}>Últimos 7 dias</Text>
        </View>

        <View style={styles.weekBar}>
          {DAYS.map((day, idx) => {
            const height = Math.random() * 40 + 10;
            const isToday = idx === 4;
            return (
              <View key={day} style={styles.weekDayCol}>
                <View style={[styles.bar, { height }, isToday && styles.barToday]} />
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>{day}</Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#27AE60" />
          <Text style={styles.statValue}>{earnings.services}</Text>
          <Text style={styles.statLabel}>SERVIÇOS</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#F5C518" />
          <Text style={styles.statValue}>—</Text>
          <Text style={styles.statLabel}>ONLINE</Text>
        </View>
      </View>

      {/* Recent history */}
      <View style={styles.historyHeader}>
        <Text style={styles.historyTitle}>Histórico Recente</Text>
        <TouchableOpacity onPress={() => Alert.alert('Histórico', 'Funcionalidade em breve.')}>
          <Text style={styles.seeAll}>Ver tudo →</Text>
        </TouchableOpacity>
      </View>

      {recentServices.length === 0 ? (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyText}>Nenhum serviço realizado ainda.</Text>
        </View>
      ) : (
        recentServices.map((svc) => (
          <View key={svc.id} style={styles.serviceItem}>
            <View style={styles.serviceIconBox}>
              <Ionicons name="car-sport" size={20} color="#F5C518" />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceType}>{svc.vehicleModel}</Text>
              <Text style={styles.serviceDate}>{formatDate(svc.createdAt)}</Text>
            </View>
            <View style={styles.servicePriceBox}>
              <Text style={styles.servicePrice}>
                {formatCurrency(svc.estimatedPrice || 145)}
              </Text>
              <View style={styles.paidBadge}>
                <Text style={styles.paidText}>PAGO</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A' },
  content: { padding: 20, paddingBottom: 40 },
  loadingContainer: { flex: 1, backgroundColor: '#0D1B2A', alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  avatarContainer: { position: 'relative', marginRight: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#27AE60',
    borderWidth: 2,
    borderColor: '#0D1B2A',
  },
  appTitle: { flex: 1, fontSize: 16, fontWeight: '800', color: '#fff' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 5,
  },
  statusOnline: { backgroundColor: 'rgba(39,174,96,0.15)' },
  statusOffline: { backgroundColor: 'rgba(255,255,255,0.1)' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  dotOnline: { backgroundColor: '#27AE60' },
  dotOffline: { backgroundColor: '#888' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextOnline: { color: '#27AE60' },
  statusTextOffline: { color: '#888' },
  toggleCard: {
    backgroundColor: '#1C2D3E',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: '#fff' },
  earningsCard: {
    backgroundColor: '#1A2E1A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#27AE60',
  },
  earningsLabel: { fontSize: 11, color: '#888', fontWeight: '700', letterSpacing: 1, marginBottom: 8 },
  earningsValue: { fontSize: 32, fontWeight: '800', color: '#F5C518', marginBottom: 8 },
  earningsGrowth: {},
  growthText: { fontSize: 12, color: '#27AE60' },
  card: {
    backgroundColor: '#1C2D3E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardSubtitle: { fontSize: 12, color: '#888' },
  weekBar: { flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 6 },
  weekDayCol: { flex: 1, alignItems: 'center', gap: 4 },
  bar: { width: '80%', borderRadius: 4, backgroundColor: '#2A3D50' },
  barToday: { backgroundColor: '#F5C518' },
  dayLabel: { fontSize: 9, color: '#555', fontWeight: '600' },
  dayLabelToday: { color: '#F5C518' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#1C2D3E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 10, color: '#888', fontWeight: '700', letterSpacing: 1 },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  historyTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  seeAll: { fontSize: 13, color: '#F5C518', fontWeight: '600' },
  emptyHistory: { padding: 20, alignItems: 'center' },
  emptyText: { color: '#555', fontSize: 14 },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2D3E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F5C518',
  },
  serviceIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0D1B2A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  serviceInfo: { flex: 1 },
  serviceType: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 3 },
  serviceDate: { fontSize: 11, color: '#888' },
  servicePriceBox: { alignItems: 'flex-end', gap: 4 },
  servicePrice: { fontSize: 14, fontWeight: '800', color: '#F5C518' },
  paidBadge: {
    backgroundColor: 'rgba(39,174,96,0.2)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  paidText: { fontSize: 9, color: '#27AE60', fontWeight: '700' },
});
