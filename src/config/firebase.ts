import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// MESMO projeto Firebase do rebocar-client
const firebaseConfig = {
  apiKey: "AIzaSyClHUvgkKe2GNcXXqUCQNQxReAsKqQLck4",
  authDomain: "rebocar-379f9.firebaseapp.com",
  databaseURL: "https://rebocar-379f9-default-rtdb.firebaseio.com",
  projectId: "rebocar-379f9",
  storageBucket: "rebocar-379f9.firebasestorage.app",
  messagingSenderId: "1019154398388",
  appId: "1:1019154398388:web:cfadc9b4bbc4c0e93e6be1",
  measurementId: "G-KBRQNHW00K"
};
// const firebaseConfig = {
//   apiKey: "COLE_AQUI_SUA_API_KEY",
//   authDomain: "COLE_AQUI_SEU_AUTH_DOMAIN",
//   projectId: "COLE_AQUI_SEU_PROJECT_ID",
//   storageBucket: "COLE_AQUI_SEU_STORAGE_BUCKET",
//   messagingSenderId: "COLE_AQUI_SEU_MESSAGING_SENDER_ID",
//   appId: "COLE_AQUI_SEU_APP_ID",
// };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
