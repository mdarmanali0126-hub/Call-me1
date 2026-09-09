import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigRaw from '../../firebase-applet-config.json';

const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || firebaseConfigRaw.apiKey,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigRaw.authDomain,
  projectId: env.VITE_FIREBASE_PROJECT_ID || firebaseConfigRaw.projectId,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigRaw.storageBucket,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigRaw.messagingSenderId,
  appId: env.VITE_FIREBASE_APP_ID || firebaseConfigRaw.appId,
  measurementId: env.VITE_FIREBASE_MEASUREMENT_ID || firebaseConfigRaw.measurementId || undefined,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
const databaseId = env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || firebaseConfigRaw.firestoreDatabaseId;
export const db = databaseId
  ? getFirestore(app, databaseId)
  : getFirestore(app);

export default app;
