import React, { useState } from 'react';
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
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { DriverStackParamList, TowServiceType } from '../../types';
import { registerDriver } from '../../services/authService';

const PIX_KEY_TYPES = [
  { value: 'phone', label: 'Telefone' },
  { value: 'email', label: 'E-mail' },
  { value: 'cpf', label: 'CPF' },
  { value: 'random', label: 'Chave Aleatória' },
] as const;

const SERVICE_OPTIONS: { type: TowServiceType; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'car', label: 'Guincho para Carro', sub: 'Veículos de passeio', icon: 'car-outline' },
  { type: 'truck', label: 'Guincho para Caminhão', sub: 'Veículos pesados', icon: 'bus-outline' },
  { type: 'munck', label: 'Caminhão Munck', sub: 'Içamento com guindaste', icon: 'construct-outline' },
];

type Nav = NativeStackNavigationProp<DriverStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const [step, setStep] = useState(1);

  // Step 1: Personal data + CNH photos
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [cnhFrontUri, setCnhFrontUri] = useState<string | undefined>();
  const [cnhBackUri, setCnhBackUri] = useState<string | undefined>();
  const [accepted, setAccepted] = useState(false);

  // Step 2: Account + vehicle + service types
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [cnh, setCnh] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [serviceTypes, setServiceTypes] = useState<TowServiceType[]>([]);
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'phone' | 'email' | 'cpf' | 'random'>('phone');
  const [showPassword, setShowPassword] = useState(false);

  const toggleServiceType = (type: TowServiceType) => {
    setServiceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const [loading, setLoading] = useState(false);

  const pickCNHPhoto = async (side: 'front' | 'back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      if (side === 'front') setCnhFrontUri(result.assets[0].uri);
      else setCnhBackUri(result.assets[0].uri);
    }
  };

  const handleStep1Next = () => {
    if (!name.trim() || !cpf.trim() || !birthDate.trim() || !email.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos pessoais.');
      return;
    }
    if (!accepted) {
      Alert.alert('Termos', 'Aceite os termos para continuar.');
      return;
    }
    setStep(2);
  };

  const handleRegister = async () => {
    if (!phone.trim() || !password.trim() || !cnh.trim() || !vehicleModel.trim() || !vehiclePlate.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha todos os campos do veículo.');
      return;
    }
    if (serviceTypes.length === 0) {
      Alert.alert('Tipo de serviço', 'Selecione pelo menos um tipo de guincho que você oferece.');
      return;
    }
    if (!pixKey.trim()) {
      Alert.alert('Chave PIX', 'Informe sua chave PIX para receber pagamentos.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Senha fraca', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    try {
      await registerDriver({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        cpf: cpf.trim(),
        birthDate: birthDate.trim(),
        cnh: cnh.trim(),
        vehicleModel: vehicleModel.trim(),
        vehiclePlate: vehiclePlate.trim().toUpperCase(),
        serviceTypes,
        pixKey: pixKey.trim(),
        pixKeyType,
        password,
        cnhFrontUri,
        cnhBackUri,
      });
      navigation.replace('Main');
    } catch (e: any) {
      Alert.alert('Erro no cadastro', e.message || 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Cadastro de Motorista  REBOCAR</Text>
        </TouchableOpacity>

        <View style={styles.stepIndicator}>
          <Text style={styles.stepText}>PASSO 1 DE 2</Text>
          <Text style={styles.stepLabel}>DADOS PESSOAIS</Text>
        </View>

        <View style={styles.dualAccountNote}>
          <Ionicons name="information-circle-outline" size={16} color="#F5C518" />
          <Text style={styles.dualAccountText}>
            Já é cliente ReboCar? Use o mesmo e-mail e senha da sua conta de cliente — você não precisará criar uma nova conta.
          </Text>
        </View>

        <Text style={styles.greeting}>Seja bem-vindo, parceiro.</Text>
        <Text style={styles.greetingSubtitle}>
          Para começar, precisamos de algumas informações básicas para validar sua conta profissional.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.cardTitle}>| Informações Básicas</Text>

          <Text style={styles.fieldLabel}>NOME COMPLETO</Text>
          <TextInput
            style={styles.input}
            placeholder="Como consta no seu documento"
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.fieldLabel}>CPF</Text>
          <TextInput
            style={styles.input}
            placeholder="000.000.000-00"
            placeholderTextColor="#666"
            value={cpf}
            onChangeText={setCpf}
            keyboardType="numeric"
          />

          <Text style={styles.fieldLabel}>DATA DE NASCIMENTO</Text>
          <TextInput
            style={styles.input}
            placeholder="mm/dd/yyyy"
            placeholderTextColor="#666"
            value={birthDate}
            onChangeText={setBirthDate}
          />

          <Text style={styles.fieldLabel}>E-MAIL</Text>
          <TextInput
            style={styles.input}
            placeholder="exemplo@email.com"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.cnhCard}>
          <Text style={styles.cardTitle}>| Documentação (CNH)</Text>
          <Text style={styles.cnhSubtitle}>
            Sua CNH deve estar dentro da validade e com a observação EAR (Exerce Atividade Remunerada).
          </Text>

          <View style={styles.cnhPhotosRow}>
            <TouchableOpacity style={styles.cnhPhotoBox} onPress={() => pickCNHPhoto('front')}>
              {cnhFrontUri ? (
                <Image source={{ uri: cnhFrontUri }} style={styles.cnhImage} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={28} color="#888" />
                  <Text style={styles.cnhPhotoLabel}>FRENTE DA CNH</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cnhPhotoBox} onPress={() => pickCNHPhoto('back')}>
              {cnhBackUri ? (
                <Image source={{ uri: cnhBackUri }} style={styles.cnhImage} />
              ) : (
                <>
                  <Ionicons name="camera-outline" size={28} color="#888" />
                  <Text style={styles.cnhPhotoLabel}>VERSO DA CNH</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.photoRequirements}>
            <View style={styles.reqItem}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#27AE60" />
              <Text style={styles.reqItemText}>FOTO NÍTIDA</Text>
            </View>
            <View style={styles.reqItem}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#27AE60" />
              <Text style={styles.reqItemText}>SEM REFLEXOS</Text>
            </View>
            <View style={styles.reqItem}>
              <Ionicons name="checkmark-circle-outline" size={14} color="#27AE60" />
              <Text style={styles.reqItemText}>DOCUMENTO ORIGINAL</Text>
            </View>
          </View>
        </View>

        <View style={styles.termsLinksRow}>
          <TouchableOpacity onPress={() => navigation.navigate('Legal', { type: 'terms' })}>
            <Text style={styles.termsLinkBtn}>Ler Termos de Uso</Text>
          </TouchableOpacity>
          <Text style={styles.termsDot}> · </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Legal', { type: 'privacy' })}>
            <Text style={styles.termsLinkBtn}>Política de Privacidade</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAccepted(!accepted)}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            Li e aceito os Termos de Uso e a Política de Privacidade da ReboCar.
            {'\n'}
            <Text style={styles.lgpdNote}>
              Meus dados serão tratados conforme a LGPD (Lei 13.709/2018).
            </Text>
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextBtn} onPress={handleStep1Next}>
          <Text style={styles.nextBtnText}>PROSSEGUIR PARA VEÍCULO →</Text>
        </TouchableOpacity>
        <Text style={styles.securityText}>Sua segurança é nossa prioridade.</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => setStep(1)}>
        <Text style={styles.backText}>← ReboCar</Text>
      </TouchableOpacity>

      <View style={styles.stepIndicator}>
        <Text style={styles.stepText}>PASSO 2 DE 2</Text>
        <Text style={styles.stepLabel}>CONTA E VEÍCULO</Text>
      </View>

      <Text style={styles.greeting}>Crie sua conta</Text>
      <Text style={styles.greetingSubtitle}>Pronto para a estrada com a segurança da ReboCar.</Text>

      <Text style={styles.fieldLabel}>NOME COMPLETO</Text>
      <View style={styles.inputRow}>
        <Ionicons name="person-outline" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.inputInRow}
          placeholder={name}
          placeholderTextColor="#888"
          editable={false}
          value={name}
        />
      </View>

      <Text style={styles.fieldLabel}>E-MAIL</Text>
      <View style={styles.inputRow}>
        <Ionicons name="mail-outline" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.inputInRow}
          value={email}
          editable={false}
          placeholderTextColor="#888"
        />
      </View>

      <Text style={styles.fieldLabel}>TELEFONE CELULAR</Text>
      <View style={styles.inputRow}>
        <Ionicons name="phone-portrait-outline" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.inputInRow}
          placeholder="(11) 99999-9999"
          placeholderTextColor="#666"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
      </View>

      <Text style={styles.fieldLabel}>NÚMERO DA CNH</Text>
      <TextInput
        style={styles.input}
        placeholder="00000000000"
        placeholderTextColor="#666"
        value={cnh}
        onChangeText={setCnh}
        keyboardType="numeric"
      />

      <Text style={styles.fieldLabel}>MODELO DO GUINCHO</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Ford Cargo 2429"
        placeholderTextColor="#666"
        value={vehicleModel}
        onChangeText={setVehicleModel}
      />

      <Text style={styles.fieldLabel}>PLACA DO GUINCHO</Text>
      <TextInput
        style={styles.input}
        placeholder="ABC-1234"
        placeholderTextColor="#666"
        value={vehiclePlate}
        onChangeText={setVehiclePlate}
        autoCapitalize="characters"
      />

      <Text style={styles.fieldLabel}>TIPOS DE SERVIÇO OFERECIDOS</Text>
      <Text style={styles.serviceTypeHint}>Selecione todos que se aplicam ao seu veículo.</Text>
      {SERVICE_OPTIONS.map((opt) => {
        const selected = serviceTypes.includes(opt.type);
        return (
          <TouchableOpacity
            key={opt.type}
            style={[styles.serviceTypeCard, selected && styles.serviceTypeCardSelected]}
            onPress={() => toggleServiceType(opt.type)}
          >
            <View style={[styles.serviceTypeIconBox, selected && styles.serviceTypeIconBoxSelected]}>
              <Ionicons name={opt.icon} size={22} color={selected ? '#1A1A2E' : '#888'} />
            </View>
            <View style={styles.serviceTypeInfo}>
              <Text style={[styles.serviceTypeLabel, selected && styles.serviceTypeLabelSelected]}>
                {opt.label}
              </Text>
              <Text style={styles.serviceTypeSub}>{opt.sub}</Text>
            </View>
            <View style={[styles.serviceTypeCheck, selected && styles.serviceTypeCheckSelected]}>
              {selected && <Ionicons name="checkmark" size={14} color="#1A1A2E" />}
            </View>
          </TouchableOpacity>
        );
      })}

      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>CHAVE PIX PARA RECEBIMENTO</Text>
      <Text style={styles.serviceTypeHint}>Sua chave PIX será exibida ao cliente após o serviço.</Text>
      <View style={styles.pixTypeRow}>
        {PIX_KEY_TYPES.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.pixTypeBtn, pixKeyType === opt.value && styles.pixTypeBtnSelected]}
            onPress={() => setPixKeyType(opt.value)}
          >
            <Text style={[styles.pixTypeBtnText, pixKeyType === opt.value && styles.pixTypeBtnTextSelected]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.inputRow}>
        <Ionicons name="key-outline" size={18} color="#888" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.inputInRow}
          placeholder={
            pixKeyType === 'phone' ? '(11) 99999-9999' :
            pixKeyType === 'email' ? 'seu@email.com' :
            pixKeyType === 'cpf' ? '000.000.000-00' : 'Chave aleatória'
          }
          placeholderTextColor="#666"
          value={pixKey}
          onChangeText={setPixKey}
          keyboardType={pixKeyType === 'phone' ? 'phone-pad' : pixKeyType === 'email' ? 'email-address' : 'default'}
          autoCapitalize="none"
        />
      </View>

      <Text style={[styles.fieldLabel, { marginTop: 16 }]}>SENHA</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={styles.passwordInput}
          placeholder="••••••••"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#888" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.nextBtn, loading && styles.disabledBtn]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#1A1A2E" />
        ) : (
          <Text style={styles.nextBtnText}>Criar Conta →</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginLink}>
          Já possui uma conta? <Text style={styles.termsLink}>Entrar</Text>
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A' },
  content: { padding: 24, paddingBottom: 50 },
  backText: { fontSize: 14, fontWeight: '700', color: '#F5C518', marginBottom: 20 },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  stepText: { fontSize: 11, color: '#F5C518', fontWeight: '700' },
  stepLabel: { fontSize: 11, color: '#888', fontWeight: '700' },
  greeting: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  greetingSubtitle: { fontSize: 13, color: '#888', marginBottom: 24, lineHeight: 18 },
  infoCard: {
    backgroundColor: '#1C2D3E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cnhCard: {
    backgroundColor: '#1C2D3E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#fff', marginBottom: 14 },
  cnhSubtitle: { fontSize: 12, color: '#888', marginBottom: 16, lineHeight: 16 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
    marginBottom: 6,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#1C2D3E',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#fff',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#2A3D50',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2D3E',
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2A3D50',
    marginBottom: 14,
  },
  inputInRow: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#fff' },
  cnhPhotosRow: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  cnhPhotoBox: {
    flex: 1,
    height: 100,
    backgroundColor: '#0D1B2A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A3D50',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    overflow: 'hidden',
  },
  cnhImage: { width: '100%', height: '100%' },
  cnhPhotoLabel: { fontSize: 10, color: '#888', fontWeight: '700' },
  photoRequirements: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  reqItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  reqItemText: { fontSize: 11, color: '#27AE60', fontWeight: '600' },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 20 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: '#F5C518', borderColor: '#F5C518' },
  checkmark: { color: '#000', fontSize: 12, fontWeight: '800' },
  termsText: { flex: 1, fontSize: 12, color: '#888', lineHeight: 18 },
  termsLink: { color: '#F5C518', fontWeight: '700' },
  nextBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  disabledBtn: { opacity: 0.7 },
  nextBtnText: { fontSize: 15, fontWeight: '800', color: '#1A1A2E', letterSpacing: 0.5 },
  securityText: { textAlign: 'center', fontSize: 12, color: '#555' },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2D3E',
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#2A3D50',
    marginBottom: 24,
  },
  passwordInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: '#fff' },
  loginLink: { textAlign: 'center', fontSize: 13, color: '#666', marginTop: 4 },
  serviceTypeHint: { fontSize: 12, color: '#555', marginBottom: 12, lineHeight: 16 },
  serviceTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2D3E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#2A3D50',
    gap: 12,
  },
  serviceTypeCardSelected: { borderColor: '#F5C518', backgroundColor: '#1E2D1A' },
  serviceTypeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0D1B2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTypeIconBoxSelected: { backgroundColor: '#F5C518' },
  serviceTypeInfo: { flex: 1 },
  serviceTypeLabel: { fontSize: 14, fontWeight: '700', color: '#888', marginBottom: 2 },
  serviceTypeLabelSelected: { color: '#fff' },
  serviceTypeSub: { fontSize: 11, color: '#555' },
  serviceTypeCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#2A3D50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTypeCheckSelected: { backgroundColor: '#F5C518', borderColor: '#F5C518' },
  termsLinksRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  termsLinkBtn: { fontSize: 12, color: '#F5C518', fontWeight: '700', textDecorationLine: 'underline' },
  termsDot: { fontSize: 12, color: '#555' },
  lgpdNote: { fontSize: 11, color: '#555', fontStyle: 'italic' },
  pixTypeRow: { flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' },
  pixTypeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A3D50',
    backgroundColor: '#1C2D3E',
  },
  pixTypeBtnSelected: { borderColor: '#F5C518', backgroundColor: 'rgba(245,197,24,0.15)' },
  pixTypeBtnText: { fontSize: 12, color: '#555', fontWeight: '600' },
  pixTypeBtnTextSelected: { color: '#F5C518' },
  dualAccountNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245,197,24,0.1)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(245,197,24,0.3)',
  },
  dualAccountText: { flex: 1, fontSize: 12, color: '#F5C518', lineHeight: 18 },
});
