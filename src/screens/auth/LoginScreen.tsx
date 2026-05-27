import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DriverStackParamList } from '../../types';
import { loginDriver } from '../../services/authService';

type Props = {
  navigation: NativeStackNavigationProp<DriverStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await loginDriver(email.trim(), password);
      navigation.replace('Main');
    } catch (e: any) {
      Alert.alert('Erro no login', e.message || 'Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoEmoji}>🚛</Text>
          </View>
          <Text style={styles.appName}>ReboCar Driver</Text>
          <View style={styles.onlineIndicator}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Parceiro</Text>
          </View>
        </View>

        <Text style={styles.title}>Bem-vindo, parceiro!</Text>
        <Text style={styles.subtitle}>Entre para começar a receber solicitações.</Text>

        <Text style={styles.label}>E-MAIL</Text>
        <TextInput
          style={styles.input}
          placeholder="parceiro@email.com"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholderStyle={{ color: '#666' }}
        />

        <Text style={styles.label}>SENHA</Text>
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
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#1A1A2E" />
          ) : (
            <Text style={styles.loginBtnText}>Entrar →</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.registerLinkText}>
            Ainda não é parceiro?{' '}
            <Text style={styles.registerLinkBold}>Cadastre-se</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D1B2A' },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 70,
    paddingBottom: 40,
  },
  logoContainer: { alignItems: 'center', marginBottom: 36 },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#F5C518',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoEmoji: { fontSize: 40 },
  appName: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8 },
  onlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 197, 24, 0.15)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
  },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F5C518' },
  onlineText: { color: '#F5C518', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 6 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 28 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#555',
    marginBottom: 6,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: '#1C2D3E',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fff',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#2A3D50',
  },
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C2D3E',
    borderRadius: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#2A3D50',
    marginBottom: 28,
  },
  passwordInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#fff' },
  eyeIcon: { fontSize: 18, padding: 4 },
  loginBtn: {
    backgroundColor: '#F5C518',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  loginBtnText: { fontSize: 16, fontWeight: '800', color: '#1A1A2E' },
  registerLink: { alignItems: 'center' },
  registerLinkText: { fontSize: 14, color: '#666' },
  registerLinkBold: { color: '#F5C518', fontWeight: '700' },
});
