import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { MOCK_VEHICLES, MOCK_PROFILES, MOCK_REQUESTS, MOCK_FAVORITES, MOCK_MESSAGES } from './services/mockData.js';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const hasFirebaseKeys = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey.trim() !== '' &&
  firebaseConfig.projectId &&
  firebaseConfig.projectId.trim() !== ''
);

export let app = null;
export let auth = null;
export let db = null;
export let storage = null;
export let googleProvider = null;
export let isMock = true; // Default to safe, high-speed local mode until Firestore connectivity is verified
export let isFirestoreHealthy = false;

// --- PERSISTENT MOCK STORAGE ENGINE ---
const STORAGE_KEYS = {
  VEHICLES: 'suv_vehicles',
  PROFILES: 'suv_profiles',
  REQUESTS: 'suv_requests',
  MESSAGES: 'suv_messages',
  FAVORITES: 'suv_favorites',
  CURRENT_USER: 'suv_current_user'
};

export function initMockDatabase() {
  const needsInit = !localStorage.getItem('suv_db_initialized') ||
    !localStorage.getItem(STORAGE_KEYS.VEHICLES) ||
    JSON.parse(localStorage.getItem(STORAGE_KEYS.VEHICLES) || '[]').length === 0;

  if (needsInit) {
    localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(MOCK_VEHICLES));
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(MOCK_PROFILES));
    localStorage.setItem(STORAGE_KEYS.REQUESTS, JSON.stringify(MOCK_REQUESTS));
    localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(MOCK_MESSAGES));
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(MOCK_FAVORITES));
    
    // Default logged in user: Jean Dossou (client)
    const defaultUserProfile = MOCK_PROFILES.find(p => p.id === 'user-id-1') || MOCK_PROFILES[1];
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(defaultUserProfile));
    
    localStorage.setItem('suv_db_initialized', 'true');
    console.log('SUV Marketplace: Local high-speed storage seeded successfully.');
  }
}

// Always ensure local storage is instantly seeded so the site is never blank
initMockDatabase();

export const mockDb = {
  getCollection: (key) => {
    try {
      const data = localStorage.getItem(key);
      const parsed = data ? JSON.parse(data) : [];
      if ((!parsed || parsed.length === 0) && key === STORAGE_KEYS.VEHICLES) {
        localStorage.setItem(STORAGE_KEYS.VEHICLES, JSON.stringify(MOCK_VEHICLES));
        return MOCK_VEHICLES;
      }
      return parsed;
    } catch (e) {
      console.error(`Error reading mock collection ${key}`, e);
      return [];
    }
  },
  saveCollection: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      window.dispatchEvent(new CustomEvent('mock_db_update', { detail: { key, data } }));
    } catch (e) {
      console.error(`Error saving mock collection ${key}`, e);
    }
  },
  KEYS: STORAGE_KEYS
};

// Initialize Firebase and verify Firestore non-blockingly
if (hasFirebaseKeys) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    googleProvider = new GoogleAuthProvider();
    console.log('SUV Marketplace: Firebase initialized for project:', firebaseConfig.projectId);

    // Fast non-blocking health probe (timeout 2s)
    const probeFirestore = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 2000));
        const testQuery = getDocs(query(collection(db, 'vehicles'), limit(1)));
        await Promise.race([testQuery, timeoutPromise]);
        
        isMock = false;
        isFirestoreHealthy = true;
        console.log('SUV Marketplace: Cloud Firestore is active & connected.');
        window.dispatchEvent(new CustomEvent('firebase_status_change', { detail: { healthy: true } }));
      } catch (err) {
        // PERMISSION_DENIED or API Disabled or network timeout: fall back cleanly
        isMock = true;
        isFirestoreHealthy = false;
        console.warn('SUV Marketplace: Cloud Firestore not accessible (API disabled or permissions). Operating in ultra-fast local mode.', err.message);
        window.dispatchEvent(new CustomEvent('firebase_status_change', { detail: { healthy: false, reason: err.message } }));
      }
    };

    probeFirestore().catch(() => {
      isMock = true;
    });
  } catch (error) {
    console.error('SUV Marketplace: Firebase initialization error, falling back to local mode.', error);
    isMock = true;
  }
} else {
  console.log('SUV Marketplace: Running in local high-speed mode (no Firebase keys).');
}
