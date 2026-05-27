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
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DriverStackParamList } from '../../types';
import { registerDriver } from '../../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<DriverStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const [step, setStep] = useState(1);

  // Step 1: Personal data + CNH photos
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [email, setEmail] = useState('');
  const [cnhFrontUri, setCnhFrontUri] = useState<string | undefined>();
  const [cnhBackUri, setCnhBackUri] = useState<string | undefined>();
  const [accepted, setAccepted] = useState(false);

  // Step 2: Account + vehicle
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [cnh, setCnh] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
                  <Text style={styles.cameraIcon}>📷</Text>
                  <Text style={styles.cnhPhotoLabel}>FRENTE DA CNH</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.cnhPhotoBox} onPress={() => pickCNHPhoto('back')}>
              {cnhBackUri ? (
                <Image source={{ uri: cnhBackUri }} style={styles.cnhImage} />
              ) : (
                <>
                  <Text style={styles.cameraIcon}>📷</Text>
                  <Text style={styles.cnhPhotoLabel}>VERSO DA CNH</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.photoRequirements}>
            <Text style={styles.reqItem}>✅ FOTO NÍTIDA</Text>
            <Text style={styles.reqItem}>✅ SEM REFLEXOS</Text>
            <Text style={styles.reqItem}>✅ DOCUMENTO ORIGINAL</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setAccepted(!accepted)}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.termsText}>
            Li e aceito os <Text style={styles.termsLink}>Termos de Uso</Text> e a{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text> da ReboCar.
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
        <Text>👤 </Text>
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
        <Text>✉️ </Text>
        <TextInput
          style={styles.inputInRow}
          value={email}
          editable={false}
          placeholderTextColor="#888"
        />
      </View>

      <Text style={styles.fieldLabel}>TELEFONE CELULAR</Text>
      <View style={styles.inputRow}>
        <Text>📱 </Text>
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

      <Text style={styles.fieldLabel}>SENHA</Text>
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
          <Text>{showPassword ? '🙈' : '👁'}</Text>
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
  cameraIcon: { fontSize: 28 },
  cnhPhotoLabel: { fontSize: 10, color: '#888', fontWeight: '700' },
  photoRequirements: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  reqItem: { fontSize: 11, color: '#27AE60', fontWeight: '600' },
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
});
