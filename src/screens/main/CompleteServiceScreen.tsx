import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { RequestsStackParamList, ServiceRequest, TOW_SERVICE_LABELS, TOW_SERVICE_PRICES } from '../../types';
import { completeRequest, createPayment } from '../../services/driverService';
import { getDriverProfile } from '../../services/authService';

type Nav = NativeStackNavigationProp<RequestsStackParamList, 'CompleteService'>;
type RouteProps = RouteProp<RequestsStackParamList, 'CompleteService'>;

export default function CompleteServiceScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProps>();
  const { requestId } = route.params;
  const [request, setRequest] = useState<ServiceRequest | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const snap = await getDoc(doc(db, 'requests', requestId));
      if (snap.exists()) setRequest({ id: snap.id, ...snap.data() } as ServiceRequest);
    })();
  }, [requestId]);

  const addPhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.6,
    });
    if (!result.canceled) setPhotos((prev) => [...prev, result.assets[0].uri]);
  };

  const handleComplete = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid || !request) return;
    setLoading(true);
    try {
      await completeRequest(requestId, uid, photos[0], notes);

      // Create payment record so the client can pay via PIX
      const profile = await getDriverProfile(uid);
      if (profile?.pixKey) {
        const amount = request.estimatedPrice ?? TOW_SERVICE_PRICES[request.serviceType] ?? 145;
        await createPayment(
          requestId,
          request.clientId,
          uid,
          amount,
          request.serviceType,
          profile.pixKey,
          profile.pixKeyType || 'phone'
        );
      }

      Alert.alert('Atendimento finalizado!', 'O cliente será notificado para realizar o pagamento via PIX.', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('RequestsList'),
        },
      ]);
    } catch (e: any) {
      Alert.alert('Erro', e.message || 'Não foi possível finalizar o atendimento.');
    } finally {
      setLoading(false);
    }
  };

  if (!request) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F5C518" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resumo da Finalização</Text>
        <View style={styles.onlineBadge}>
          <Text style={styles.onlineBadgeText}>ONLINE</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Summary card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.clientAvatar}>
              <Ionicons name="person" size={20} color="#1A1A2E" />
            </View>
            <View>
              <Text style={styles.summaryClientName}>{request.clientName}</Text>
              <View style={styles.addressRow}>
                <Ionicons name="location-outline" size={12} color="#888" />
                <Text style={styles.addressText} numberOfLines={1}>
                  {request.destinationAddress || 'Destino não informado'}
                </Text>
              </View>
            </View>
            <View style={styles.valueBox}>
              <Text style={styles.valueLabel}>VALOR</Text>
              <Text style={styles.valueLabelSub}>TOTAL</Text>
              <Text style={styles.valueAmount}>
                R$ {(request.estimatedPrice || 145).toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailsRow}>
            <View>
              <Text style={styles.detailFieldLabel}>VEÍCULO</Text>
              <Text style={styles.detailFieldValue}>{request.vehicleModel} - {request.vehiclePlate}</Text>
            </View>
            <View>
              <Text style={styles.detailFieldLabel}>MODALIDADE</Text>
              <View style={styles.modalityBox}>
                <Ionicons name="car-sport" size={16} color="#F5C518" />
                <Text style={styles.modalityText}>
                  {request.serviceType ? TOW_SERVICE_LABELS[request.serviceType] : 'Guincho'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Registration */}
        <Text style={styles.sectionTitle}>Registro do Atendimento</Text>

        <View style={styles.photosCard}>
          <Text style={styles.photosLabel}>FOTOS DO SERVIÇO CONCLUÍDO</Text>
          <View style={styles.photosRow}>
            {photos.map((uri, idx) => (
              <View key={idx} style={styles.photoThumb}>
                <Image source={{ uri }} style={styles.photoImage} />
                <TouchableOpacity
                  style={styles.removePhoto}
                  onPress={() => setPhotos(photos.filter((_, i) => i !== idx))}
                >
                  <Text style={styles.removePhotoText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addPhotoBtn} onPress={addPhoto}>
              <Ionicons name="camera-outline" size={24} color="#888" />
              <Text style={styles.addPhotoLabel}>ADICIONAR</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.notesCard}>
          <Text style={styles.notesLabel}>OBSERVAÇÕES FINAIS (OPCIONAL)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Ex: Veículo entregue na oficina indicada sem novas avarias. Chaves deixadas na recepção."
            placeholderTextColor="#555"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Security notice */}
        <View style={styles.securityCard}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#F5C518" style={{ marginTop: 2 }} />
          <Text style={styles.securityText}>
            <Text style={styles.securityBold}>SEGURANÇA REBOCAR{'\n'}</Text>
            A finalização requer confirmação de localização via GPS para processamento do pagamento.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.completeBtn, loading && styles.completeBtnDisabled]}
          onPress={handleComplete}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1A1A2E" />
          ) : (
            <Text style={styles.completeBtnText}>FINALIZAR ATENDIMENTO</Text>
          )}
        </TouchableOpacity>
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
  onlineBadge: {
    backgroundColor: 'rgba(39,174,96,0.2)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#27AE60',
  },
  onlineBadgeText: { fontSize: 10, color: '#27AE60', fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: '#1C2D3E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  clientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    fontSize: 20,
  },
  summaryClientName: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 3 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addressText: { fontSize: 12, color: '#888', maxWidth: 140 },
  valueBox: { marginLeft: 'auto', alignItems: 'flex-end' },
  valueLabel: { fontSize: 9, color: '#888', fontWeight: '700' },
  valueLabelSub: { fontSize: 9, color: '#888', fontWeight: '700' },
  valueAmount: { fontSize: 16, fontWeight: '800', color: '#F5C518' },
  divider: { height: 1, backgroundColor: '#2A3D50', marginBottom: 14 },
  detailsRow: { flexDirection: 'row', gap: 24 },
  detailFieldLabel: { fontSize: 9, color: '#888', fontWeight: '700', marginBottom: 4 },
  detailFieldValue: { fontSize: 13, color: '#fff', fontWeight: '600' },
  modalityBox: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalityText: { fontSize: 13, color: '#fff', fontWeight: '600' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#888', marginBottom: 12, letterSpacing: 1 },
  photosCard: {
    backgroundColor: '#1C2D3E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  photosLabel: { fontSize: 10, color: '#888', fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  photosRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  photoThumb: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoImage: { width: '100%', height: '100%' },
  removePhoto: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2A3D50',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addPhotoLabel: { fontSize: 8, color: '#888', fontWeight: '700' },
  notesCard: {
    backgroundColor: '#1C2D3E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  notesLabel: { fontSize: 10, color: '#888', fontWeight: '700', letterSpacing: 1, marginBottom: 10 },
  notesInput: {
    fontSize: 13,
    color: '#aaa',
    lineHeight: 20,
    height: 100,
    textAlignVertical: 'top',
  },
  securityCard: {
    flexDirection: 'row',
    backgroundColor: '#1C2D3E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F5C518',
  },
  securityText: { flex: 1, fontSize: 12, color: '#888', lineHeight: 18 },
  securityBold: { color: '#F5C518', fontWeight: '700' },
  completeBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  completeBtnDisabled: { opacity: 0.7 },
  completeBtnText: { fontSize: 15, fontWeight: '800', color: '#1A1A2E' },
});
