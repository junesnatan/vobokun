import { db, storage, isMock, mockDb } from '../firebase.js';
import { MOCK_VEHICLES } from './mockData.js';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  increment 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Helper: Auto-seed Firestore if empty
let isSeeding = false;
let seedAttempted = false;
async function seedFirestoreVehiclesIfEmpty() {
  if (isMock || isSeeding || !db || seedAttempted) return;
  isSeeding = true;
  seedAttempted = true;
  try {
    const vehiclesCol = collection(db, 'vehicles');
    const snap = await getDocs(vehiclesCol);
    if (snap.empty) {
      for (const vehicle of MOCK_VEHICLES) {
        await setDoc(doc(db, 'vehicles', vehicle.id), vehicle);
      }
    }
  } catch (e) {
    // Silent fail if Firestore is disabled or permissions error
  } finally {
    isSeeding = false;
  }
}

// Retrieve vehicles list with filters, sort, and pagination
export async function getVehicles(filters = {}, sortBy = 'dateDesc', page = 1, limitCount = 24) {
  const start = (page - 1) * limitCount;
  const end = start + limitCount;

  // Always fetch cached / local list first for instant 0ms rendering
  let list = mockDb.getCollection(mockDb.KEYS.VEHICLES);
  if (!list || list.length === 0) {
    list = MOCK_VEHICLES;
    mockDb.saveCollection(mockDb.KEYS.VEHICLES, list);
  }

  // Trigger background Firestore sync and auto-seed if online
  if (!isMock && db) {
    seedFirestoreVehiclesIfEmpty().then(async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'vehicles'));
        if (!querySnapshot.empty) {
          const freshList = [];
          querySnapshot.forEach(d => freshList.push({ id: d.id, ...d.data() }));
          mockDb.saveCollection(mockDb.KEYS.VEHICLES, freshList);
        }
      } catch (e) {
        // ignore
      }
    }).catch(console.error);
  }

  // Apply Filters
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    list = list.filter(v => 
      v.marque?.toLowerCase().includes(searchLower) ||
      v.modele?.toLowerCase().includes(searchLower) ||
      (v.description && v.description.toLowerCase().includes(searchLower))
    );
  }
  if (filters.marque && filters.marque.length > 0) {
    list = list.filter(v => filters.marque.includes(v.marque));
  }
  if (filters.prixMin !== undefined) {
    list = list.filter(v => Number(v.prix) >= Number(filters.prixMin));
  }
  if (filters.prixMax !== undefined) {
    list = list.filter(v => Number(v.prix) <= Number(filters.prixMax));
  }
  if (filters.anneeMin !== undefined) {
    list = list.filter(v => Number(v.annee) >= Number(filters.anneeMin));
  }
  if (filters.anneeMax !== undefined) {
    list = list.filter(v => Number(v.annee) <= Number(filters.anneeMax));
  }
  if (filters.carburant) {
    list = list.filter(v => v.carburant === filters.carburant);
  }
  if (filters.transmission) {
    list = list.filter(v => v.transmission === filters.transmission);
  }
  if (filters.kilometrageMax !== undefined) {
    list = list.filter(v => Number(v.kilometrage) <= Number(filters.kilometrageMax));
  }
  if (filters.featuredOnly) {
    list = list.filter(v => v.featured === true);
  }
  if (filters.statut) {
    list = list.filter(v => v.statut === filters.statut);
  } else {
    list = list.filter(v => v.statut !== 'archivé');
  }

  // Apply Sorting
  if (sortBy === 'prixAsc') {
    list.sort((a, b) => Number(a.prix) - Number(b.prix));
  } else if (sortBy === 'prixDesc') {
    list.sort((a, b) => Number(b.prix) - Number(a.prix));
  } else if (sortBy === 'kilometrageAsc') {
    list.sort((a, b) => Number(a.kilometrage) - Number(b.kilometrage));
  } else {
    list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  }

  const total = list.length;
  const paginatedList = list.slice(start, end);

  return { data: paginatedList, count: total, error: null };
}

// Fetch single vehicle by ID
export async function getVehicleById(id) {
  const list = mockDb.getCollection(mockDb.KEYS.VEHICLES);
  const vehicle = list.find(v => v.id === id);

  if (!isMock && db) {
    getDoc(doc(db, 'vehicles', id)).then(docSnap => {
      if (docSnap.exists()) {
        const fresh = { id: docSnap.id, ...docSnap.data() };
        const index = list.findIndex(v => v.id === id);
        if (index !== -1) list[index] = fresh;
        else list.push(fresh);
        mockDb.saveCollection(mockDb.KEYS.VEHICLES, list);
      }
    }).catch(console.error);
  }

  if (vehicle) return { data: vehicle, error: null };
  return { data: MOCK_VEHICLES.find(v => v.id === id) || null, error: null };
}

// Increment Views on single vehicle
export async function incrementViews(id) {
  const list = mockDb.getCollection(mockDb.KEYS.VEHICLES);
  const index = list.findIndex(v => v.id === id);
  if (index !== -1) {
    list[index].vues = (list[index].vues || 0) + 1;
    mockDb.saveCollection(mockDb.KEYS.VEHICLES, list);
  }

  if (!isMock && db) {
    try {
      await updateDoc(doc(db, 'vehicles', id), { vues: increment(1) });
    } catch (e) {
      // ignore
    }
  }
}

// Get similar vehicles
export async function getSimilarVehicles(vehicle) {
  if (!vehicle) return { data: [], error: null };

  const { data: allVehicles } = await getVehicles({ statut: 'disponible' }, 'dateDesc', 1, 50);
  const filtered = (allVehicles || [])
    .filter(v => v.id !== vehicle.id)
    .sort((a, b) => {
      const aBrandMatch = a.marque === vehicle.marque ? 1 : 0;
      const bBrandMatch = b.marque === vehicle.marque ? 1 : 0;
      if (aBrandMatch !== bBrandMatch) {
        return bBrandMatch - aBrandMatch;
      }
      return Math.abs(Number(a.prix) - Number(vehicle.prix)) - Math.abs(Number(b.prix) - Number(vehicle.prix));
    });

  return { data: filtered.slice(0, 4), error: null };
}

// Create vehicle (Admin)
export async function createVehicle(vehicleData) {
  const list = mockDb.getCollection(mockDb.KEYS.VEHICLES);
  const newVehicle = {
    ...vehicleData,
    id: 'suv-vobokun-' + Math.random().toString(36).substr(2, 9),
    vues: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  list.unshift(newVehicle);
  mockDb.saveCollection(mockDb.KEYS.VEHICLES, list);

  if (!isMock && db) {
    setDoc(doc(db, 'vehicles', newVehicle.id), newVehicle).catch(console.error);
  }

  return { data: newVehicle, error: null };
}

// Update vehicle (Admin)
export async function updateVehicle(id, vehicleData) {
  const list = mockDb.getCollection(mockDb.KEYS.VEHICLES);
  const index = list.findIndex(v => v.id === id);

  const updated = {
    ...(index !== -1 ? list[index] : {}),
    ...vehicleData,
    id,
    updated_at: new Date().toISOString()
  };

  if (index !== -1) {
    list[index] = updated;
  } else {
    list.unshift(updated);
  }
  mockDb.saveCollection(mockDb.KEYS.VEHICLES, list);

  if (!isMock && db) {
    updateDoc(doc(db, 'vehicles', id), vehicleData).catch(console.error);
  }

  return { data: updated, error: null };
}

// Delete vehicle (Admin)
export async function deleteVehicle(id) {
  const list = mockDb.getCollection(mockDb.KEYS.VEHICLES);
  const filtered = list.filter(v => v.id !== id);
  mockDb.saveCollection(mockDb.KEYS.VEHICLES, filtered);

  if (!isMock && db) {
    deleteDoc(doc(db, 'vehicles', id)).catch(console.error);
  }

  return { error: null };
}

// Upload vehicle photos
export async function uploadVehiclePhotos(files) {
  if (isMock || !storage) {
    const promises = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });
    });
    return Promise.all(promises);
  }

  try {
    const uploadPromises = Array.from(files).map(async (file) => {
      const fileExt = file.name.split('.').pop();
      const storageRef = ref(storage, `vehicles/${Math.random().toString(36).substring(2, 9)}_${Date.now()}.${fileExt}`);
      await uploadBytes(storageRef, file);
      return getDownloadURL(storageRef);
    });

    return Promise.all(uploadPromises);
  } catch (err) {
    console.error('uploadVehiclePhotos error:', err);
    throw err;
  }
}
