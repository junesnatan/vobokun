import { db, isMock, mockDb } from '../firebase.js';
import { getCurrentUser } from './auth.js';
import { getVehicles } from './vehicles.js';
import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc, 
  doc, 
  query, 
  where 
} from 'firebase/firestore';

function getLocalFavorites(userId) {
  const favorites = mockDb.getCollection(mockDb.KEYS.FAVORITES);
  const vehicles = mockDb.getCollection(mockDb.KEYS.VEHICLES);
  
  return favorites
    .filter(f => f.user_id === userId)
    .map(f => vehicles.find(v => v.id === f.vehicle_id))
    .filter(Boolean);
}

// Get all favorited vehicles for the logged in user
export async function getFavorites() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { data: [], error: null };

  const localFavorites = getLocalFavorites(currentUser.id);

  if (isMock || !db) {
    return { data: localFavorites, error: null };
  }

  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 1800));
    const favsCol = collection(db, 'favorites');
    const q = query(favsCol, where('user_id', '==', currentUser.id));
    const favsSnap = await Promise.race([getDocs(q), timeoutPromise]);

    const vehicleIds = [];
    favsSnap.forEach(d => {
      vehicleIds.push(d.data().vehicle_id);
    });

    if (vehicleIds.length === 0) {
      return { data: localFavorites, error: null };
    }

    const { data: allVehicles } = await getVehicles({}, 'dateDesc', 1, 100);
    const favoriteVehicles = (allVehicles || []).filter(v => vehicleIds.includes(v.id));

    return { data: favoriteVehicles.length > 0 ? favoriteVehicles : localFavorites, error: null };
  } catch (error) {
    console.warn('getFavorites Firestore fallback to local:', error.message);
    return { data: localFavorites, error: null };
  }
}

// Check if a specific vehicle is favorited by the logged in user
export async function isFavorite(vehicleId) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return false;

  const favorites = mockDb.getCollection(mockDb.KEYS.FAVORITES);
  const localMatch = favorites.some(f => f.user_id === currentUser.id && f.vehicle_id === vehicleId);

  if (isMock || !db) {
    return localMatch;
  }

  try {
    const favsCol = collection(db, 'favorites');
    const q = query(favsCol, where('user_id', '==', currentUser.id), where('vehicle_id', '==', vehicleId));
    const favsSnap = await getDocs(q);
    return !favsSnap.empty;
  } catch (error) {
    return localMatch;
  }
}

// Toggle favorite status
export async function toggleFavorite(vehicleId) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Vous devez être connecté pour gérer vos favoris.");

  // Always update local storage first for 0ms immediate UI response
  const favorites = mockDb.getCollection(mockDb.KEYS.FAVORITES);
  const index = favorites.findIndex(f => f.user_id === currentUser.id && f.vehicle_id === vehicleId);

  let favorited = false;
  if (index !== -1) {
    favorites.splice(index, 1);
    favorited = false;
  } else {
    favorites.push({
      user_id: currentUser.id,
      vehicle_id: vehicleId,
      created_at: new Date().toISOString()
    });
    favorited = true;
  }
  
  mockDb.saveCollection(mockDb.KEYS.FAVORITES, favorites);
  window.dispatchEvent(new CustomEvent('favorites_update', { detail: { vehicleId, favorited } }));

  // Background Firestore sync
  if (!isMock && db) {
    try {
      const favsCol = collection(db, 'favorites');
      const q = query(favsCol, where('user_id', '==', currentUser.id), where('vehicle_id', '==', vehicleId));
      getDocs(q).then(favsSnap => {
        if (!favsSnap.empty && !favorited) {
          favsSnap.forEach(d => deleteDoc(doc(db, 'favorites', d.id)));
        } else if (favsSnap.empty && favorited) {
          addDoc(favsCol, {
            user_id: currentUser.id,
            vehicle_id: vehicleId,
            created_at: new Date().toISOString()
          });
        }
      }).catch(err => {
        console.warn('Firestore toggleFavorite sync error:', err.message);
      });
    } catch (error) {
      // ignore
    }
  }

  return favorited;
}
