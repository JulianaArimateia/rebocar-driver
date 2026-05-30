import {
  collection,
  doc,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocs,
  getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { ServiceRequest, Location, DriverStatus, TowServiceType } from '../types';

export const updateDriverStatus = async (
  driverId: string,
  status: DriverStatus
): Promise<void> => {
  await updateDoc(doc(db, 'drivers', driverId), { status });
};

export const updateDriverLocation = async (
  driverId: string,
  location: Location
): Promise<void> => {
  await updateDoc(doc(db, 'drivers', driverId), { location });
};

export const subscribeToNearbyRequests = (
  driverLocation: Location,
  callback: (requests: ServiceRequest[]) => void,
  driverServiceTypes?: TowServiceType[]
) => {
  const q = query(
    collection(db, 'requests'),
    where('status', '==', 'waiting'),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snap) => {
    const requests = snap.docs
      .map((d) => ({ id: d.id, ...d.data() } as ServiceRequest))
      .filter((req) => {
        const dist = haversineDistance(driverLocation, req.clientLocation);
        if (dist > 200) return false;
        if (driverServiceTypes && driverServiceTypes.length > 0) {
          return driverServiceTypes.includes(req.serviceType);
        }
        return true;
      });
    callback(requests);
  });
};

export const acceptRequest = async (
  requestId: string,
  driverId: string
): Promise<void> => {
  await updateDoc(doc(db, 'requests', requestId), {
    driverId,
    status: 'accepted',
    acceptedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'drivers', driverId), { status: 'busy' });
};

export const updateRequestStatus = async (
  requestId: string,
  status: ServiceRequest['status']
): Promise<void> => {
  const update: any = { status };
  if (status === 'on_the_way') update.departedAt = serverTimestamp();
  if (status === 'arrived') update.arrivedAt = serverTimestamp();
  if (status === 'completed') update.completedAt = serverTimestamp();
  await updateDoc(doc(db, 'requests', requestId), update);
};

export const completeRequest = async (
  requestId: string,
  driverId: string,
  servicePhotoUri?: string,
  notes?: string
): Promise<void> => {
  const update: any = {
    status: 'completed',
    completedAt: serverTimestamp(),
    ...(notes && { completionNotes: notes }),
  };

  if (servicePhotoUri) {
    const response = await fetch(servicePhotoUri);
    const blob = await response.blob();
    const storageRef = ref(storage, `services/${requestId}_completion.jpg`);
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    update.completionPhotoUrl = url;
  }

  await updateDoc(doc(db, 'requests', requestId), update);
  await updateDoc(doc(db, 'drivers', driverId), {
    status: 'available',
    totalServices: (await getDriverTotalServices(driverId)) + 1,
  });
};

const getDriverTotalServices = async (driverId: string): Promise<number> => {
  const snap = await getDoc(doc(db, 'drivers', driverId));
  return snap.exists() ? (snap.data().totalServices || 0) : 0;
};

export const getDriverHistory = async (driverId: string): Promise<ServiceRequest[]> => {
  const q = query(
    collection(db, 'requests'),
    where('driverId', '==', driverId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ServiceRequest));
};

export const subscribeToActiveRequest = (
  driverId: string,
  callback: (request: ServiceRequest | null) => void
) => {
  const q = query(
    collection(db, 'requests'),
    where('driverId', '==', driverId),
    where('status', 'in', ['accepted', 'on_the_way', 'arrived'])
  );
  return onSnapshot(q, (snap) => {
    if (snap.empty) {
      callback(null);
    } else {
      const doc = snap.docs[0];
      callback({ id: doc.id, ...doc.data() } as ServiceRequest);
    }
  });
};

export const getDriverEarnings = async (
  driverId: string
): Promise<{ week: number; total: number; services: number }> => {
  const q = query(
    collection(db, 'requests'),
    where('driverId', '==', driverId),
    where('status', '==', 'completed')
  );
  const snap = await getDocs(q);
  const services = snap.docs.length;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  let weekEarnings = 0;
  let totalEarnings = 0;

  snap.docs.forEach((d) => {
    const price = d.data().estimatedPrice || 145;
    totalEarnings += price;
    const createdAt = d.data().createdAt?.toDate?.() || new Date();
    if (createdAt >= oneWeekAgo) weekEarnings += price;
  });

  return { week: weekEarnings, total: totalEarnings, services };
};

export const createPayment = async (
  requestId: string,
  clientId: string,
  driverId: string,
  amount: number,
  serviceType: string,
  pixKey: string,
  pixKeyType: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'payments'), {
    requestId,
    clientId,
    driverId,
    amount,
    serviceType,
    pixKey,
    pixKeyType,
    status: 'pending_client',
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'requests', requestId), { paymentId: docRef.id });
  return docRef.id;
};

export const confirmPaymentByDriver = async (paymentId: string): Promise<void> => {
  await updateDoc(doc(db, 'payments', paymentId), {
    status: 'driver_confirmed',
    driverConfirmedAt: serverTimestamp(),
  });
};

export const subscribeToDriverPayments = (
  driverId: string,
  callback: (payments: any[]) => void
) => {
  const q = query(
    collection(db, 'payments'),
    where('driverId', '==', driverId),
    where('status', '==', 'client_confirmed')
  );
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
  });
};

export const haversineDistance = (a: Location, b: Location): number => {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const sin1 = Math.sin(dLat / 2);
  const sin2 = Math.sin(dLon / 2);
  const h =
    sin1 * sin1 +
    Math.cos((a.latitude * Math.PI) / 180) *
      Math.cos((b.latitude * Math.PI) / 180) *
      sin2 *
      sin2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};
