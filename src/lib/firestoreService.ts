import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User,
  getIdToken
} from 'firebase/auth';
import { db, auth } from './firebase';
import { Profile, AdvertisingSettings, TelemetryEvent, AnalyticsSummary } from '../types';
import { INITIAL_ADVERTISING_SETTINGS } from './seedData';

const PROFILES_COLLECTION = 'profiles';
const SETTINGS_COLLECTION = 'settings';
const AD_SETTINGS_DOC = 'advertising';
const TELEMETRY_COLLECTION = 'telemetry';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Security Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// -----------------------------------------------------------
// Profiles Operations
// -----------------------------------------------------------

export async function fetchProfilesFromFirestore(onlyPublished = false): Promise<Profile[]> {
  const path = PROFILES_COLLECTION;
  try {
    const colRef = collection(db, path);
    let q = query(colRef);
    if (onlyPublished) {
      q = query(colRef, where('published', '==', true));
    }
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return [];
    }

    const profiles: Profile[] = [];
    snapshot.forEach(docSnap => {
      profiles.push(docSnap.data() as Profile);
    });

    return profiles.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  } catch (error) {
    console.warn('Firestore fetch notice:', error);
    return [];
  }
}

export async function getProfileBySlugFromFirestore(slug: string): Promise<Profile | null> {
  const path = PROFILES_COLLECTION;
  try {
    const colRef = collection(db, path);
    const q = query(colRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data() as Profile;
    }
    return null;
  } catch (error) {
    console.warn('Firestore getProfileBySlug error:', error);
    return null;
  }
}

export async function saveProfileToFirestore(profile: Profile): Promise<void> {
  const path = `${PROFILES_COLLECTION}/${profile.id}`;
  try {
    const docRef = doc(db, PROFILES_COLLECTION, profile.id);
    const data = {
      ...profile,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, data, { merge: true });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
    throw error;
  }
}

export async function deleteProfileFromFirestore(id: string): Promise<void> {
  const path = `${PROFILES_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PROFILES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
    throw error;
  }
}

export async function toggleProfilePublish(id: string, published: boolean): Promise<void> {
  const path = `${PROFILES_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, PROFILES_COLLECTION, id);
    await updateDoc(docRef, {
      published,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
    throw error;
  }
}

export async function incrementProfileViewInFirestore(slug: string): Promise<void> {
  try {
    const colRef = collection(db, PROFILES_COLLECTION);
    const q = query(colRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const docSnap = snapshot.docs[0];
      await updateDoc(docSnap.ref, {
        views: increment(1)
      });
    }
  } catch (error) {
    console.warn('Increment view note:', error);
  }
}

// -----------------------------------------------------------
// Advertising Settings Operations
// -----------------------------------------------------------

export async function fetchAdSettingsFromFirestore(): Promise<AdvertisingSettings> {
  const path = `${SETTINGS_COLLECTION}/${AD_SETTINGS_DOC}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, AD_SETTINGS_DOC);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as AdvertisingSettings;
      return {
        ...data,
        ads: {
          popunder: data.ads?.popunder ?? false,
          socialBar: data.ads?.socialBar ?? false,
          banner: data.ads?.banner ?? false,
        }
      };
    }
    return INITIAL_ADVERTISING_SETTINGS;
  } catch (error) {
    console.warn('Error fetching ad settings, using seed fallback:', error);
    return INITIAL_ADVERTISING_SETTINGS;
  }
}

export async function saveAdSettingsToFirestore(settings: AdvertisingSettings): Promise<void> {
  const path = `${SETTINGS_COLLECTION}/${AD_SETTINGS_DOC}`;
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, AD_SETTINGS_DOC);
    await setDoc(docRef, {
      ...settings,
      updatedAt: new Date().toISOString()
    });
  } catch (error: any) {
    if (error?.code === 'permission-denied') {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
    throw error;
  }
}

// -----------------------------------------------------------
// Telemetry Operations
// -----------------------------------------------------------

export async function logTelemetryInFirestore(event: TelemetryEvent): Promise<void> {
  try {
    const colRef = collection(db, TELEMETRY_COLLECTION);
    const docRef = doc(colRef);
    await setDoc(docRef, {
      ...event,
      id: docRef.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Non-blocking telemetry log
    console.warn('Telemetry event logged locally:', error);
  }
}

export async function fetchTelemetrySummary(): Promise<AnalyticsSummary> {
  try {
    const colRef = collection(db, TELEMETRY_COLLECTION);
    const snapshot = await getDocs(colRef);
    const events: TelemetryEvent[] = [];
    let pageViews = 0;
    let storyViews = 0;
    let contactClicks = 0;
    let adClicks = 0;

    snapshot.forEach(docSnap => {
      const e = docSnap.data() as TelemetryEvent;
      events.push(e);
      if (e.type === 'page_view') pageViews++;
      if (e.type === 'story_open' || e.type === 'story_complete') storyViews++;
      if (e.type === 'contact_click') contactClicks++;
      if (e.type === 'ad_click') adClicks++;
    });

    const profiles = await fetchProfilesFromFirestore(false);
    const popular = profiles
      .map(p => ({ id: p.id, slug: p.slug, fullName: p.fullName, views: p.views || 0 }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    return {
      totalViews: pageViews + profiles.reduce((acc, p) => acc + (p.views || 0), 0),
      totalStoryViews: storyViews,
      totalContactClicks: contactClicks,
      totalAdClicks: adClicks,
      popularProfiles: popular,
      recentEvents: events.slice(-20).reverse()
    };
  } catch (error) {
    return {
      totalViews: 0,
      totalStoryViews: 0,
      totalContactClicks: 0,
      totalAdClicks: 0,
      popularProfiles: [],
      recentEvents: []
    };
  }
}

/**
 * Non-destructive Firestore synchronization.
 * Preserves all real candidate profiles created by the administrator.
 * NEVER re-inserts, deletes, or overwrites candidate profiles with demo data.
 */
export async function refreshFirestoreSync(): Promise<Profile[]> {
  try {
    // 1. Fetch current real profiles from Firestore
    const liveProfiles = await fetchProfilesFromFirestore(false);

    // 2. Ensure system configuration documents exist if missing (does not touch profiles)
    try {
      const adDocRef = doc(db, SETTINGS_COLLECTION, AD_SETTINGS_DOC);
      const snap = await getDoc(adDocRef);
      if (!snap.exists()) {
        await setDoc(adDocRef, INITIAL_ADVERTISING_SETTINGS);
      }
    } catch (confErr) {
      console.warn('System settings sync notice:', confErr);
    }

    return liveProfiles;
  } catch (err) {
    console.warn('Firestore refresh notice:', err);
    return [];
  }
}

// -----------------------------------------------------------
// Firebase Authentication Service
// -----------------------------------------------------------

export interface AuthErrorDetails {
  category: 'wrong_credentials' | 'user_not_found' | 'unauthorized' | 'network' | 'provider_disabled' | 'too_many_requests' | 'popup_blocked' | 'cancelled' | 'unauthorized_domain' | 'general';
  message: string;
  originalCode: string;
}

export function parseAuthError(error: any): AuthErrorDetails {
  const code = error?.code || '';
  const rawMessage = error?.message || 'Authentication failed';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return {
        category: 'wrong_credentials',
        message: 'Invalid email or password. Please verify your administrator credentials and try again.',
        originalCode: code
      };
    case 'auth/user-not-found':
      return {
        category: 'user_not_found',
        message: 'No administrator account found with this email address. Please verify the email or register this account in your Firebase Console.',
        originalCode: code
      };
    case 'auth/invalid-email':
      return {
        category: 'wrong_credentials',
        message: 'The email address provided is improperly formatted. Please enter a valid email.',
        originalCode: code
      };
    case 'auth/user-disabled':
      return {
        category: 'unauthorized',
        message: 'This administrator account has been disabled. Please contact the project administrator.',
        originalCode: code
      };
    case 'auth/operation-not-allowed':
      return {
        category: 'provider_disabled',
        message: 'Firebase Email/Password provider is not yet enabled in the Firebase Console. The Firebase Project Owner must enable "Email/Password" under Authentication > Sign-in method.',
        originalCode: code
      };
    case 'auth/too-many-requests':
      return {
        category: 'too_many_requests',
        message: 'Access to this account has been temporarily disabled due to multiple failed login attempts. Please wait a few moments or reset your password.',
        originalCode: code
      };
    case 'auth/network-request-failed':
      return {
        category: 'network',
        message: 'Network error: Failed to connect to Firebase Authentication servers. Please verify your internet connection.',
        originalCode: code
      };
    case 'auth/popup-blocked':
      return {
        category: 'popup_blocked',
        message: 'The sign-in popup was blocked by your browser. Please allow popups for this site or open this application in a new browser tab.',
        originalCode: code
      };
    case 'auth/popup-closed-by-user':
      return {
        category: 'cancelled',
        message: 'The Google Sign-In popup was closed before completing authentication. Please click the button again to sign in.',
        originalCode: code
      };
    case 'auth/cancelled-popup-request':
      return {
        category: 'cancelled',
        message: 'A previous authentication window is still active. Please finish signing in or click again.',
        originalCode: code
      };
    case 'auth/unauthorized-domain':
      return {
        category: 'unauthorized_domain',
        message: 'Unauthorized domain: The current domain is not authorized for OAuth operations in Firebase Authentication. Please add "call-me1.vercel.app" to Authorized Domains in Firebase Console.',
        originalCode: code
      };
    case 'auth/account-exists-with-different-credential':
      return {
        category: 'wrong_credentials',
        message: 'An account already exists with this email address under a different sign-in method.',
        originalCode: code
      };
    default:
      return {
        category: 'general',
        message: rawMessage,
        originalCode: code || 'auth/unknown'
      };
  }
}

export async function syncAdminRecord(user: User): Promise<void> {
  if (user.email?.toLowerCase() === 'mdarmanali0126@gmail.com') {
    try {
      const adminDocRef = doc(db, 'admins', user.uid);
      await setDoc(
        adminDocRef,
        {
          email: user.email,
          displayName: user.displayName || 'Administrator',
          role: 'super_admin',
          authProvider: user.providerData[0]?.providerId || 'google.com',
          lastLoginAt: new Date().toISOString()
        },
        { merge: true }
      );
    } catch (e) {
      console.warn('Admin Firestore profile sync notice:', e);
    }
  }
}

export async function loginAdmin(email: string, pass: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(auth, email.trim(), pass);
  if (cred.user.email?.toLowerCase() === 'mdarmanali0126@gmail.com') {
    await syncAdminRecord(cred.user);
  }
  return cred.user;
}

export async function loginAdminWithGoogle(): Promise<User> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account',
    login_hint: 'mdarmanali0126@gmail.com'
  });
  const cred = await signInWithPopup(auth, provider);
  if (cred.user.email?.toLowerCase() === 'mdarmanali0126@gmail.com') {
    await syncAdminRecord(cred.user);
  }
  return cred.user;
}

export async function logoutAdmin(): Promise<void> {
  await signOut(auth);
}

export async function getCurrentUserToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  try {
    return await getIdToken(auth.currentUser);
  } catch (err) {
    return null;
  }
}

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
