import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { auth } from '../../config/firebase';
import { RequestsStackParamList, ServiceRequest, TOW_SERVICE_LABELS } from '../../types';
import { updateRequestStatus } from '../../services/driverService';

type Nav = NativeStackNavigationProp<RequestsStackParamList, 'ServiceDetail'>;
type RouteProps = RouteProp<RequestsStackParamList, 'ServiceDetail'>;

const STATUS_LABELS: Record<string, string> = {
  accepted: 'Chamado Aceito',
  on_the_way: 'A Caminho',
  arrived: 'Chegada ao Local',
  completed: 'Concluído',
};

export default function ServiceDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { requestId } = route.params;
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [clientPhone, setClientPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const openCall = (phone: string) => {
    const clean = phone.replace(/\D/g, '');
    Linking.openURL(`tel:+55${clean}`);
  };

  const openWhatsApp = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Olá ${name}, sou o guincheiro responsável pelo seu atendimento ReboCar.`);
    Linking.openURL(`https://wa.me/55${clean}?text=${msg}`).catch(() => {
      Linking.openURL(`sms:+55${clean}`);
    });
  };

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'requests', requestId), async (snap) => {
      if (snap.exists()) {
        const req = { id: snap.id, ...snap.data() } as ServiceRequest;
        setRequest(req);
        // Carrega telefone do cliente
        if (req.clientId && !clientPhone) {
          const userSnap = await getDoc(doc(db, 'users', req.clientId));
          if (userSnap.exists()) setClientPhone(userSnap.data().phone || '');
        }
      }
    });
    return unsub;
  }, [requestId]);

  const handleUpdateStatus = async (newStatus: ServiceRequest['status']) => {
    if (!request) return;
    setLoading(true);
    try {
      await updateRequestStatus(requestId, newStatus);
    } catch (e: any) {
      Alert.alert('Erro', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = () => {
    navigation.navigate('Navigation', { requestId });
  };

  const handleComplete = () => {
    navigation.navigate('CompleteService', { requestId });
  };

  if (!request) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5C518" />
      </View>
    );
  }

  const statusKeys = ['accepted', 'on_the_way', 'arrived', 'completed'];
  const currentIdx = statusKeys.indexOf(request.status);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Serviço</Text>
        <View style={styles.statusPill}>
          <Text style={styles.statusPillText}>EM ANDAMENTO</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Client info */}
        <View style={styles.clientCard}>
          <View style={styles.clientAvatar}>
            <Ionicons name="person" size={26} color="#1A1A2E" />
          </View>
          <View style={styles.clientInfo}>
            <Text style={styles.clientLabel}>CLIENTE</Text>
            <Text style={styles.clientName}>{request.clientName}</Text>
            <Text style={styles.clientRating}>★ 4.9</Text>
          </View>
          <View style={styles.clientActions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => clientPhone ? openWhatsApp(clientPhone, request?.clientName || 'Cliente') : Alert.alert('Indisponível', 'Telefone do cliente não disponível.')}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => clientPhone ? openCall(clientPhone) : Alert.alert('Indisponível', 'Telefone do cliente não disponível.')}
            >
              <Ionicons name="call-outline" size={18} color="#2980B9" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ETA */}
        <View style={styles.etaCard}>
          <View style={styles.etaCircle}>
            <Ionicons name="flag-outline" size={24} color="#F5C518" />
            <Text style={styles.etaLabel}>ETA</Text>
            <Text style={styles.etaValue}>12 min</Text>
          </View>
        </View>

        {/* Vehicle info */}
        <View style={styles.card}>
          <View style={styles.serviceTypePill}>
            <Text style={styles.serviceTypeText}>
              {request.serviceType ? TOW_SERVICE_LABELS[request.serviceType] : 'Guincho'}
            </Text>
          </View>
          <Text style={styles.cardTitle}>Informações do Veículo</Text>
          <View style={styles.vehicleRow}>
            <View>
              <Text style={styles.vehicleFieldLabel}>MODELO</Text>
              <Text style={styles.vehicleFieldValue}>{request.vehicleModel}</Text>
            </View>
            <View>
              <Text style={styles.vehicleFieldLabel}>PLACA</Text>
              <View style={styles.plateBadge}>
                <Text style={styles.plateText}>{request.vehiclePlate}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.vehicleFieldLabel}>DESCRIÇÃO DO PROBLEMA</Text>
          <Text style={styles.problemText}>{request.problemDescription}</Text>
        </View>

        {/* Vehicle photos */}
        {request.photoUrl && (
          <View style={styles.card}>
            <View style={styles.photosHeader}>
              <Text style={styles.cardTitle}>Fotos do Local</Text>
              <Text style={styles.photoCount}>1 FOTO</Text>
            </View>
            <Image source={{ uri: request.photoUrl }} style={styles.vehiclePhoto} />
          </View>
        )}

        {/* Status timeline */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Status do Chamado</Text>
          {statusKeys.map((key, idx) => (
            <View key={key} style={styles.timelineRow}>
              <View style={[styles.timelineDot, idx <= currentIdx && styles.timelineDotActive]}>
                {idx <= currentIdx && <Text style={styles.check}>✓</Text>}
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, idx <= currentIdx && styles.timelineLabelActive]}>
                  {STATUS_LABELS[key]}
                </Text>
                {idx === currentIdx && <Text style={styles.timelineSubtext}>Em andamento...</Text>}
              </View>
            </View>
          ))}
        </View>

        {/* Action buttons */}
        {request.status === 'accepted' && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              handleUpdateStatus('on_the_way');
              handleNavigate();
            }}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#1A1A2E" />
            ) : (
              <Text style={styles.primaryBtnText}>INICIAR NAVEGAÇÃO</Text>
            )}
          </TouchableOpacity>
        )}

        {request.status === 'on_the_way' && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => handleUpdateStatus('arrived')}
            disabled={loading}
          >
            <Text style={styles.primaryBtnText}>CHEGUEI AO LOCAL</Text>
          </TouchableOpacity>
        )}

        {request.status === 'arrived' && (
          <TouchableOpacity style={styles.primaryBtn} onPress={handleComplete} disabled={loading}>
            <Text style={styles.primaryBtnText}>FINALIZAR ATENDIMENTO</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A' },
  loadingContainer: { flex: 1, backgroundColor: '#0D1B2A', alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C2D3E',
  },
  backBtn: { fontSize: 22, color: '#fff', fontWeight: '700', marginRight: 12 },
  headerTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#fff' },
  statusPill: {
    backgroundColor: '#F5C518',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusPillText: { fontSize: 10, fontWeight: '800', color: '#1A1A2E' },
  content: { padding: 16, paddingBottom: 40 },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2D3E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  clientInfo: { flex: 1 },
  clientLabel: { fontSize: 10, color: '#888', fontWeight: '700', marginBottom: 2 },
  clientName: { fontSize: 16, fontWeight: '800', color: '#fff', marginBottom: 2 },
  clientRating: { fontSize: 13, color: '#F5C518' },
  clientActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0D1B2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  etaCard: {
    backgroundColor: '#1C2D3E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  etaCircle: { alignItems: 'center', gap: 4 },
  etaLabel: { fontSize: 11, color: '#888', fontWeight: '700' },
  etaValue: { fontSize: 18, fontWeight: '800', color: '#F5C518' },
  card: {
    backgroundColor: '#1C2D3E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 14 },
  vehicleRow: { flexDirection: 'row', gap: 24, marginBottom: 14 },
  vehicleFieldLabel: { fontSize: 10, color: '#888', fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  vehicleFieldValue: { fontSize: 15, fontWeight: '700', color: '#fff' },
  plateBadge: {
    backgroundColor: '#0D1B2A',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F5C518',
  },
  plateText: { fontSize: 14, fontWeight: '800', color: '#F5C518', letterSpacing: 2 },
  serviceTypePill: {
    backgroundColor: 'rgba(245,197,24,0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.3)',
  },
  serviceTypeText: { fontSize: 12, fontWeight: '700', color: '#F5C518' },
  problemText: { fontSize: 13, color: '#aaa', lineHeight: 18 },
  photosHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  photoCount: { fontSize: 11, color: '#F5C518', fontWeight: '700' },
  vehiclePhoto: { width: '100%', height: 180, borderRadius: 10 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 14 },
  timelineDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#2A3D50',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  timelineDotActive: { backgroundColor: '#F5C518', borderColor: '#F5C518' },
  check: { fontSize: 12, color: '#1A1A2E', fontWeight: '800' },
  timelineContent: { flex: 1 },
  timelineLabel: { fontSize: 14, color: '#555', fontWeight: '600' },
  timelineLabelActive: { color: '#fff' },
  timelineSubtext: { fontSize: 11, color: '#888', marginTop: 2 },
  primaryBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
});
