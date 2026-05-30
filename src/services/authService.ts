import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';
import { TowServiceType } from '../types';

export const forgotPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim());
};

export const requestDataDeletion = async (uid: string, reason?: string): Promise<void> => {
  await addDoc(collection(db, 'deletionRequests'), {
    userId: uid,
    reason: reason || 'Solicitação do motorista',
    status: 'pending',
    createdAt: serverTimestamp(),
  });
};

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  cnh: string;
  vehicleModel: string;
  vehiclePlate: string;
  serviceTypes: TowServiceType[];
  pixKey: string;
  pixKeyType: 'cpf' | 'email' | 'phone' | 'random' | 'cnpj';
  type: 'driver';
  status: 'available' | 'busy' | 'offline';
  verificationStatus: VerificationStatus;
  rating: number;
  totalServices: number;
  termsAcceptedAt: any;
  createdAt: any;
}

export const uploadCNHPhoto = async (uri: string, uid: string, side: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `cnh/${uid}_${side}.jpg`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

// Uma mesma pessoa pode ser motorista E cliente com o mesmo e-mail.
// Se o e-mail já existe (ex: cadastrado como cliente), fazemos login com as credenciais
// e criamos apenas o perfil de motorista (drivers/{uid}) sem mexer no perfil de cliente.
export const registerDriver = async (data: {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  cnh: string;
  vehicleModel: string;
  vehiclePlate: string;
  serviceTypes: TowServiceType[];
  pixKey: string;
  pixKeyType: 'cpf' | 'email' | 'phone' | 'random' | 'cnpj';
  password: string;
  cnhFrontUri?: string;
  cnhBackUri?: string;
}): Promise<DriverProfile> => {
  let uid: string;

  try {
    const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
    uid = credential.user.uid;
  } catch (e: any) {
    if (e.code === 'auth/email-already-in-use') {
      // E-mail já existe — pode ser um cliente querendo se tornar motorista parceiro.
      try {
        const credential = await signInWithEmailAndPassword(auth, data.email, data.password);
        uid = credential.user.uid;
      } catch {
        throw new Error(
          'Este e-mail já está cadastrado. Se você é cliente, use a mesma senha da conta de cliente para criar sua conta de motorista.'
        );
      }
    } else {
      throw e;
    }
  }

  // Verifica se já tem perfil de motorista — não permite duplicata
  const existingDriverSnap = await getDoc(doc(db, 'drivers', uid));
  if (existingDriverSnap.exists()) {
    throw new Error('Este e-mail já está cadastrado como motorista parceiro. Faça login.');
  }

  let cnhFrontUrl: string | undefined;
  let cnhBackUrl: string | undefined;

  if (data.cnhFrontUri) cnhFrontUrl = await uploadCNHPhoto(data.cnhFrontUri, uid, 'front');
  if (data.cnhBackUri) cnhBackUrl = await uploadCNHPhoto(data.cnhBackUri, uid, 'back');

  const driverProfile: DriverProfile = {
    id: uid,
    name: data.name,
    email: data.email,
    phone: data.phone,
    cpf: data.cpf,
    birthDate: data.birthDate,
    cnh: data.cnh,
    vehicleModel: data.vehicleModel,
    vehiclePlate: data.vehiclePlate,
    serviceTypes: data.serviceTypes,
    pixKey: data.pixKey,
    pixKeyType: data.pixKeyType,
    type: 'driver',
    status: 'offline',
    verificationStatus: 'pending', // Conta bloqueada até revisão manual das fotos da CNH
    rating: 5.0,
    totalServices: 0,
    termsAcceptedAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    ...(cnhFrontUrl && { cnhFrontUrl }),
    ...(cnhBackUrl && { cnhBackUrl }),
  };

  // Atualiza/cria o documento base em users (merge para não sobrescrever dados de cliente existentes)
  await setDoc(doc(db, 'users', uid), {
    id: uid,
    name: data.name,
    email: data.email,
    phone: data.phone,
    type: 'both', // pode ser cliente e motorista ao mesmo tempo
    driverTermsAcceptedAt: serverTimestamp(),
  }, { merge: true });

  // Cria o perfil específico de motorista
  await setDoc(doc(db, 'drivers', uid), driverProfile);

  return driverProfile;
};

// Login no app motorista:
// - Funciona para motoristas puros
// - Funciona para clientes que também são motoristas (type: 'both')
// - Se for cliente sem perfil de motorista: orienta a completar o cadastro de motorista
export const loginDriver = async (email: string, password: string): Promise<DriverProfile> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const uid = credential.user.uid;

  const snap = await getDoc(doc(db, 'drivers', uid));
  if (snap.exists()) return snap.data() as DriverProfile;

  // Sem perfil de motorista — verifica se é cliente
  const userSnap = await getDoc(doc(db, 'users', uid));
  if (userSnap.exists()) {
    throw new Error(
      'Este e-mail está cadastrado como cliente ReboCar.\n\nPara trabalhar como motorista parceiro, toque em "Ainda não é parceiro? Cadastre-se" e use este mesmo e-mail e senha — você não precisará criar uma nova conta.'
    );
  }

  throw new Error('Conta de motorista não encontrada. Verifique seu e-mail e senha.');
};

export const logoutDriver = () => signOut(auth);

export const getDriverProfile = async (uid: string): Promise<DriverProfile | null> => {
  const snap = await getDoc(doc(db, 'drivers', uid));
  return snap.exists() ? (snap.data() as DriverProfile) : null;
};
