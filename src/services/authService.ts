import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from '../config/firebase';

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
  type: 'driver';
  status: 'available' | 'busy' | 'offline';
  rating: number;
  totalServices: number;
  createdAt: any;
}

export const uploadCNHPhoto = async (uri: string, uid: string, side: string): Promise<string> => {
  const response = await fetch(uri);
  const blob = await response.blob();
  const storageRef = ref(storage, `cnh/${uid}_${side}.jpg`);
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
};

export const registerDriver = async (data: {
  name: string;
  email: string;
  phone: string;
  cpf: string;
  birthDate: string;
  cnh: string;
  vehicleModel: string;
  vehiclePlate: string;
  password: string;
  cnhFrontUri?: string;
  cnhBackUri?: string;
}): Promise<DriverProfile> => {
  const credential = await createUserWithEmailAndPassword(auth, data.email, data.password);
  const uid = credential.user.uid;

  let cnhFrontUrl: string | undefined;
  let cnhBackUrl: string | undefined;

  if (data.cnhFrontUri) cnhFrontUrl = await uploadCNHPhoto(data.cnhFrontUri, uid, 'front');
  if (data.cnhBackUri) cnhBackUrl = await uploadCNHPhoto(data.cnhBackUri, uid, 'back');

  const userProfile = {
    id: uid,
    name: data.name,
    email: data.email,
    phone: data.phone,
    type: 'driver',
    createdAt: serverTimestamp(),
  };

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
    type: 'driver',
    status: 'offline',
    rating: 5.0,
    totalServices: 0,
    createdAt: serverTimestamp(),
    ...(cnhFrontUrl && { cnhFrontUrl }),
    ...(cnhBackUrl && { cnhBackUrl }),
  };

  await setDoc(doc(db, 'users', uid), userProfile);
  await setDoc(doc(db, 'drivers', uid), driverProfile);

  return driverProfile;
};

export const loginDriver = async (email: string, password: string): Promise<DriverProfile> => {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const snap = await getDoc(doc(db, 'drivers', credential.user.uid));
  if (!snap.exists()) throw new Error('Conta de guincheiro não encontrada.');
  return snap.data() as DriverProfile;
};

export const logoutDriver = () => signOut(auth);

export const getDriverProfile = async (uid: string): Promise<DriverProfile | null> => {
  const snap = await getDoc(doc(db, 'drivers', uid));
  return snap.exists() ? (snap.data() as DriverProfile) : null;
};
