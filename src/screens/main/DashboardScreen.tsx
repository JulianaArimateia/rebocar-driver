import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Switch,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { auth } from '../../config/firebase';
import { getDriverProfile, VerificationStatus } from '../../services/authService';
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
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('pending');
  const [earnings, setEarnings] = useState({ week: 0, total: 0, services: 0 });
  const [recentServices, setRecentServices] = useState<ServiceRequest[]>([]);
  const [allServices, setAllServices] = useState<ServiceRequest[]>([]);
  const [showHistory, setShowHistory] = useState(false);
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
      setVerificationStatus(profile.verificationStatus ?? 'pending');
    }
    setEarnings(earningsData);
    setAllServices(history);
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
    if (verificationStatus !== 'approved') {
      Alert.alert(
        'Conta em verificação',
        'Sua CNH está sendo analisada pela nossa equipe. Você poderá ficar online assim que a verificação for concluída (até 24 horas).\n\nSe já passou mais de 24 horas, entre em contato: parceiros@rebocar.com.br'
      );
      return;
    }
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

  const STATUS_LABELS: Record<string, string> = {
    completed: 'Concluído', accepted: 'Aceito', on_the_way: 'A Caminho',
    arrived: 'Chegou', cancelled: 'Cancelado', waiting: 'Aguardando',
  };

  return (
    <>
    {/* Modal histórico completo */}
    <Modal visible={showHistory} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalSheet}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Histórico Completo</Text>
            <TouchableOpacity onPress={() => setShowHistory(false)}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={allServices}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            ListEmptyComponent={<Text style={{ color: '#555', textAlign: 'center', marginTop: 40 }}>Nenhum serviço realizado ainda.</Text>}
            renderItem={({ item }) => (
              <View style={styles.modalItem}>
                <View style={styles.serviceIconBox}>
                  <Ionicons name="car-sport" size={18} color="#F5C518" />
                </View>
                <View style={styles.serviceInfo}>
                  <Text style={styles.serviceType}>{item.vehicleModel} • {item.vehiclePlate}</Text>
                  <Text style={styles.serviceDate}>{formatDate(item.createdAt)}</Text>
                  <Text style={{ fontSize: 11, color: '#888' }}>{STATUS_LABELS[item.status] ?? item.status}</Text>
                </View>
                <View style={styles.servicePriceBox}>
                  <Text style={styles.servicePrice}>{formatCurrency((item.estimatedPrice || 145) * 0.85)}</Text>
                  <Text style={{ fontSize: 9, color: '#555' }}>líquido</Text>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </Modal>

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

      {/* Verificação de CNH */}
      {verificationStatus === 'pending' && (
        <View style={styles.verificationBanner}>
          <Ionicons name="time-outline" size={20} color="#F5C518" />
          <View style={{ flex: 1 }}>
            <Text style={styles.verificationTitle}>CNH em verificação</Text>
            <Text style={styles.verificationSub}>
              Sua documentação está sendo analisada. Você poderá receber chamados em até 24 horas após a aprovação.
            </Text>
          </View>
        </View>
      )}
      {verificationStatus === 'rejected' && (
        <View style={[styles.verificationBanner, styles.verificationRejected]}>
          <Ionicons name="alert-circle-outline" size={20} color="#FF4444" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.verificationTitle, { color: '#FF4444' }]}>Verificação reprovada</Text>
            <Text style={styles.verificationSub}>
              As fotos da CNH não foram aceitas. Entre em contato: parceiros@rebocar.com.br
            </Text>
          </View>
        </View>
      )}

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
        <Text style={styles.earningsLabel}>SEUS GANHOS ESTA SEMANA</Text>
        <Text style={styles.earningsValue}>{formatCurrency(earnings.week * 0.85)}</Text>
        <View style={styles.commissionRow}>
          <View style={styles.commissionItem}>
            <Text style={styles.commissionLabel}>Bruto</Text>
            <Text style={styles.commissionValue}>{formatCurrency(earnings.week)}</Text>
          </View>
          <View style={styles.commissionDivider} />
          <View style={styles.commissionItem}>
            <Text style={styles.commissionLabel}>Taxa plataforma (15%)</Text>
            <Text style={styles.commissionValueFee}>- {formatCurrency(earnings.week * 0.15)}</Text>
          </View>
        </View>
        <View style={styles.earningsGrowth}>
          <Text style={styles.growthText}>Total acumulado líquido: {formatCurrency(earnings.total * 0.85)}</Text>
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
        <TouchableOpacity onPress={() => setShowHistory(true)}>
          <Text style={styles.seeAll}>Ver tudo ({allServices.length}) →</Text>
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
    </>
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
  earningsGrowth: { marginTop: 8 },
  growthText: { fontSize: 12, color: '#27AE60' },
  commissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    gap: 8,
  },
  commissionItem: { flex: 1 },
  commissionLabel: { fontSize: 10, color: '#888', marginBottom: 3 },
  commissionValue: { fontSize: 13, fontWeight: '700', color: '#fff' },
  commissionValueFee: { fontSize: 13, fontWeight: '700', color: '#FF6B6B' },
  commissionDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.1)' },
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
  verificationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(245,197,24,0.1)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.3)',
  },
  verificationRejected: {
    backgroundColor: 'rgba(255,68,68,0.1)',
    borderColor: 'rgba(255,68,68,0.3)',
  },
  verificationTitle: { fontSize: 13, fontWeight: '700', color: '#F5C518', marginBottom: 3 },
  verificationSub: { fontSize: 11, color: '#888', lineHeight: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#0D1B2A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#1C2D3E',
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#fff' },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2D3E',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
});
