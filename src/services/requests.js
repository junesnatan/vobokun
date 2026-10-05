import { db, isMock, mockDb } from '../firebase.js';
import { getCurrentUser } from './auth.js';
import { getVehicles } from './vehicles.js';
import { 
  collection, 
  getDocs, 
  addDoc, 
  setDoc,
  doc, 
  updateDoc, 
  onSnapshot 
} from 'firebase/firestore';

// Helper to get local user offers
function getLocalUserOffers(userId) {
  const requests = mockDb.getCollection(mockDb.KEYS.REQUESTS);
  const vehicles = mockDb.getCollection(mockDb.KEYS.VEHICLES);
  
  return requests
    .filter(r => r.user_id === userId)
    .map(r => ({
      ...r,
      vehicle: vehicles.find(v => v.id === r.vehicle_id)
    }))
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

// Helper to get local all offers
function getLocalAllOffers() {
  const requests = mockDb.getCollection(mockDb.KEYS.REQUESTS);
  const vehicles = mockDb.getCollection(mockDb.KEYS.VEHICLES);
  const profiles = mockDb.getCollection(mockDb.KEYS.PROFILES);
  
  return requests.map(r => ({
    ...r,
    vehicle: vehicles.find(v => v.id === r.vehicle_id),
    profile: profiles.find(p => p.id === r.user_id)
  })).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

// Create a new offer on a vehicle
export async function createOffer(vehicleId, message, prixPropose) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Vous devez être connecté pour soumettre une offre.");

  const offerData = {
    id: 'req-' + Math.random().toString(36).substr(2, 9),
    user_id: currentUser.id,
    vehicle_id: vehicleId,
    message,
    prix_propose: prixPropose ? parseFloat(prixPropose) : null,
    statut: 'pending',
    note_admin: '',
    created_at: new Date().toISOString()
  };

  // Always save locally first for instant UI response
  const requests = mockDb.getCollection(mockDb.KEYS.REQUESTS);
  requests.unshift(offerData);
  mockDb.saveCollection(mockDb.KEYS.REQUESTS, requests);
  window.dispatchEvent(new CustomEvent('new_offer_received', { detail: offerData }));

  // Sync to Firestore in background if active
  if (!isMock && db) {
    try {
      setDoc(doc(db, 'requests', offerData.id), offerData).catch(err => {
        console.warn('Firestore createOffer background sync error:', err.message);
      });
    } catch (e) {
      // ignore
    }
  }

  return { data: offerData, error: null };
}

// Get offers made by current user
export async function getUserOffers() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { data: [], error: null };

  const localOffers = getLocalUserOffers(currentUser.id);

  // If mock mode or Firestore offline, return immediately
  if (isMock || !db) {
    return { data: localOffers, error: null };
  }

  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 1800));
    const reqsPromise = getDocs(collection(db, 'requests'));
    const reqsSnap = await Promise.race([reqsPromise, timeoutPromise]);
    
    const { data: allVehicles } = await getVehicles({}, 'dateDesc', 1, 100);

    const userOffers = [];
    reqsSnap.forEach(d => {
      const data = d.data();
      if (data.user_id === currentUser.id) {
        const vehicle = (allVehicles || []).find(v => v.id === data.vehicle_id);
        userOffers.push({
          id: d.id,
          ...data,
          vehicle
        });
      }
    });

    userOffers.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    
    // If Firestore returned records, merge them
    if (userOffers.length > 0) {
      return { data: userOffers, error: null };
    }
    return { data: localOffers, error: null };
  } catch (err) {
    console.warn('getUserOffers Firestore fallback to local:', err.message);
    return { data: localOffers, error: null };
  }
}

// Get all offers (Admin only)
export async function getAllOffers() {
  const localOffers = getLocalAllOffers();

  if (isMock || !db) {
    return { data: localOffers, error: null };
  }

  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 1800));
    const reqsPromise = getDocs(collection(db, 'requests'));
    const reqsSnap = await Promise.race([reqsPromise, timeoutPromise]);
    
    const profilesSnap = await getDocs(collection(db, 'profiles')).catch(() => null);
    const { data: allVehicles } = await getVehicles({}, 'dateDesc', 1, 100);

    const profiles = [];
    if (profilesSnap) {
      profilesSnap.forEach(p => profiles.push({ id: p.id, ...p.data() }));
    }

    const allOffers = [];
    reqsSnap.forEach(d => {
      const data = d.data();
      const vehicle = (allVehicles || []).find(v => v.id === data.vehicle_id);
      const profile = profiles.find(p => p.id === data.user_id) || { prenom: 'Client', nom: 'Anonyme' };
      allOffers.push({
        id: d.id,
        ...data,
        vehicle,
        profile
      });
    });

    allOffers.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    
    if (allOffers.length > 0) {
      return { data: allOffers, error: null };
    }
    return { data: localOffers, error: null };
  } catch (err) {
    console.warn('getAllOffers Firestore fallback to local:', err.message);
    return { data: localOffers, error: null };
  }
}

// Update offer status (Admin only)
export async function updateOfferStatus(offerId, statut, noteAdmin) {
  // Always update local collection first
  const requests = mockDb.getCollection(mockDb.KEYS.REQUESTS);
  const index = requests.findIndex(r => r.id === offerId);
  
  let updatedOffer = null;
  if (index !== -1) {
    requests[index].statut = statut;
    requests[index].note_admin = noteAdmin;
    mockDb.saveCollection(mockDb.KEYS.REQUESTS, requests);
    updatedOffer = requests[index];
    window.dispatchEvent(new CustomEvent('offer_status_updated', { detail: requests[index] }));
  }

  if (!isMock && db) {
    try {
      const docRef = doc(db, 'requests', offerId);
      updateDoc(docRef, { statut, note_admin: noteAdmin }).catch(err => {
        console.warn('Firestore updateOfferStatus sync error:', err.message);
      });
    } catch (e) {
      // ignore
    }
  }

  return { data: updatedOffer || { id: offerId, statut, note_admin: noteAdmin }, error: null };
}

// Subscribe to offers in real-time
export function subscribeToOffers(callback) {
  const handleMockNewOffer = () => callback();
  const handleMockOfferStatus = () => callback();
  
  window.addEventListener('new_offer_received', handleMockNewOffer);
  window.addEventListener('offer_status_updated', handleMockOfferStatus);

  let unsubscribeFirestore = () => {};
  if (!isMock && db) {
    try {
      unsubscribeFirestore = onSnapshot(collection(db, 'requests'), () => {
        callback();
      }, () => {});
    } catch (err) {
      // ignore
    }
  }

  return () => {
    window.removeEventListener('new_offer_received', handleMockNewOffer);
    window.removeEventListener('offer_status_updated', handleMockOfferStatus);
    unsubscribeFirestore();
  };
}
