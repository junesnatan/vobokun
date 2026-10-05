import { auth, db, storage, googleProvider, isMock, mockDb } from '../firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  limit, 
  getDocs 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Cached user helper for zero-delay instant UI render
const CACHE_KEY = 'suv_user_cache';

export function getCachedUser() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) return JSON.parse(cached);
    const mockUser = localStorage.getItem(mockDb.KEYS.CURRENT_USER);
    return mockUser ? JSON.parse(mockUser) : null;
  } catch (e) {
    return null;
  }
}

export function setCachedUser(user) {
  try {
    if (user) {
      localStorage.setItem(CACHE_KEY, JSON.stringify(user));
      localStorage.setItem(mockDb.KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(CACHE_KEY);
    }
  } catch (e) {
    // ignore
  }
}

// Non-blocking Firebase Auth resolution helper
export function getFirebaseAuthUser() {
  return new Promise((resolve) => {
    if (!auth) return resolve(null);
    if (auth.currentUser) return resolve(auth.currentUser);

    let resolved = false;
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (!resolved) {
        resolved = true;
        resolve(user);
      }
    });

    // Fast 250ms fallback timeout so UI is never held back by network latency
    setTimeout(() => {
      if (!resolved) {
        resolved = true;
        unsubscribe();
        resolve(auth?.currentUser || null);
      }
    }, 250);
  });
}

// Get current session or profile
export async function getCurrentUser() {
  const cached = getCachedUser();
  if (isMock || !auth) {
    return cached;
  }

  try {
    const firebaseUser = await getFirebaseAuthUser();
    if (!firebaseUser) {
      return cached;
    }

    // Check fast cache first
    if (cached && cached.id === firebaseUser.uid) {
      // Refresh profile in background asynchronously
      fetchProfileInBG(firebaseUser.uid, firebaseUser.email);
      return cached;
    }

    const profileRef = doc(db, 'profiles', firebaseUser.uid);
    const profileSnap = await getDoc(profileRef);

    let userObj;
    if (profileSnap.exists()) {
      userObj = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        ...profileSnap.data()
      };
    } else {
      userObj = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        role: 'user',
        nom: '',
        prenom: firebaseUser.displayName || 'Utilisateur',
        telephone: '',
        avatar_url: firebaseUser.photoURL || '',
        created_at: new Date().toISOString()
      };
      setDoc(profileRef, userObj).catch(console.error);
    }

    setCachedUser(userObj);
    return userObj;
  } catch (err) {
    console.warn('getCurrentUser Firebase check failed, using cached user:', err.message);
    return cached;
  }
}

async function fetchProfileInBG(uid, email) {
  try {
    const profileSnap = await getDoc(doc(db, 'profiles', uid));
    if (profileSnap.exists()) {
      const updatedUser = { id: uid, email, ...profileSnap.data() };
      setCachedUser(updatedUser);
      window.dispatchEvent(new CustomEvent('auth_state_change', { detail: updatedUser }));
    }
  } catch (e) {
    // ignore
  }
}

// Listen continuously to Firebase Auth state changes
if (!isMock && auth) {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const user = await getCurrentUser();
      window.dispatchEvent(new CustomEvent('auth_state_change', { detail: user }));
    } else {
      setCachedUser(null);
      window.dispatchEvent(new CustomEvent('auth_state_change', { detail: null }));
    }
  });
}

// Sign In
export async function signIn(email, password) {
  if (isMock) {
    const profiles = mockDb.getCollection(mockDb.KEYS.PROFILES);
    let matchedProfile = null;

    if (email === 'admin@vobokun.com') {
      matchedProfile = profiles.find(p => p.role === 'admin');
    } else {
      matchedProfile = profiles.find(p => p.prenom.toLowerCase() + '@vobokun.com' === email.toLowerCase());
      if (!matchedProfile) {
        matchedProfile = profiles.find(p => p.role === 'user');
      }
    }

    if (!matchedProfile) {
      throw new Error("Identifiants incorrects en mode démo (utilisez admin@vobokun.com ou jean@vobokun.com)");
    }

    const userObj = { ...matchedProfile, email };
    localStorage.setItem(mockDb.KEYS.CURRENT_USER, JSON.stringify(userObj));
    setCachedUser(userObj);
    window.dispatchEvent(new CustomEvent('auth_state_change', { detail: userObj }));
    return { user: userObj, error: null };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = await getCurrentUser();
    setCachedUser(user);
    window.dispatchEvent(new CustomEvent('auth_state_change', { detail: user }));
    return { user, error: null };
  } catch (error) {
    console.error('Firebase signIn error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

// Sign Up
export async function signUp(email, password, nom, prenom, telephone) {
  if (isMock) {
    const profiles = mockDb.getCollection(mockDb.KEYS.PROFILES);
    if (profiles.some(p => p.prenom.toLowerCase() + '@vobokun.com' === email.toLowerCase())) {
      throw new Error("Cet email est déjà enregistré.");
    }

    const newId = 'user-mock-' + Math.random().toString(36).substr(2, 9);
    const newProfile = {
      id: newId,
      nom,
      prenom,
      telephone,
      avatar_url: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      role: 'user',
      created_at: new Date().toISOString()
    };

    profiles.push(newProfile);
    mockDb.saveCollection(mockDb.KEYS.PROFILES, profiles);

    const userObj = { ...newProfile, email };
    localStorage.setItem(mockDb.KEYS.CURRENT_USER, JSON.stringify(userObj));
    setCachedUser(userObj);
    window.dispatchEvent(new CustomEvent('auth_state_change', { detail: userObj }));
    return { user: userObj, error: null };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const newProfile = {
      id: uid,
      nom,
      prenom,
      telephone,
      avatar_url: '',
      role: 'user',
      created_at: new Date().toISOString()
    };

    await setDoc(doc(db, 'profiles', uid), newProfile);

    const user = { ...newProfile, email };
    setCachedUser(user);
    window.dispatchEvent(new CustomEvent('auth_state_change', { detail: user }));
    return { user, error: null };
  } catch (error) {
    console.error('Firebase signUp error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

// OAuth Google Sign In
export async function signInWithGoogle() {
  if (isMock) {
    const profiles = mockDb.getCollection(mockDb.KEYS.PROFILES);
    let googleUser = profiles.find(p => p.id === 'user-id-2');
    const userObj = { ...googleUser, email: 'sophie.google@gmail.com' };
    localStorage.setItem(mockDb.KEYS.CURRENT_USER, JSON.stringify(userObj));
    setCachedUser(userObj);
    window.dispatchEvent(new CustomEvent('auth_state_change', { detail: userObj }));
    return { user: userObj, error: null };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    const firebaseUser = result.user;
    const profileRef = doc(db, 'profiles', firebaseUser.uid);
    const profileSnap = await getDoc(profileRef);

    let userProfile;
    if (!profileSnap.exists()) {
      userProfile = {
        id: firebaseUser.uid,
        nom: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
        prenom: firebaseUser.displayName?.split(' ')[0] || 'Utilisateur',
        telephone: '',
        avatar_url: firebaseUser.photoURL || '',
        role: 'user',
        created_at: new Date().toISOString()
      };
      await setDoc(profileRef, userProfile);
    } else {
      userProfile = profileSnap.data();
    }

    const user = { ...userProfile, id: firebaseUser.uid, email: firebaseUser.email };
    setCachedUser(user);
    window.dispatchEvent(new CustomEvent('auth_state_change', { detail: user }));
    return { user, error: null };
  } catch (error) {
    console.error('Firebase signInWithGoogle error:', error);
    throw new Error(getFirebaseErrorMessage(error));
  }
}

// Sign Out
export async function signOut() {
  setCachedUser(null);
  if (isMock) {
    localStorage.removeItem(mockDb.KEYS.CURRENT_USER);
    window.dispatchEvent(new CustomEvent('auth_state_change', { detail: null }));
    return { error: null };
  }

  try {
    await firebaseSignOut(auth);
    window.dispatchEvent(new CustomEvent('auth_state_change', { detail: null }));
    return { error: null };
  } catch (error) {
    console.error('Firebase signOut error:', error);
    return { error };
  }
}

// Update Profile info
export async function updateProfile(profileData) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Aucun utilisateur connecté.");

  if (isMock) {
    const profiles = mockDb.getCollection(mockDb.KEYS.PROFILES);
    const index = profiles.findIndex(p => p.id === currentUser.id);
    
    if (index !== -1) {
      profiles[index] = {
        ...profiles[index],
        nom: profileData.nom ?? profiles[index].nom,
        prenom: profileData.prenom ?? profiles[index].prenom,
        telephone: profileData.telephone ?? profiles[index].telephone,
        avatar_url: profileData.avatar_url ?? profiles[index].avatar_url
      };
      mockDb.saveCollection(mockDb.KEYS.PROFILES, profiles);
      
      const updatedUser = { ...profiles[index], email: currentUser.email };
      localStorage.setItem(mockDb.KEYS.CURRENT_USER, JSON.stringify(updatedUser));
      setCachedUser(updatedUser);
      window.dispatchEvent(new CustomEvent('auth_state_change', { detail: updatedUser }));
      return { data: updatedUser, error: null };
    }
    throw new Error("Profil introuvable.");
  }

  try {
    const profileRef = doc(db, 'profiles', currentUser.id);
    const updatePayload = {
      ...(profileData.nom !== undefined && { nom: profileData.nom }),
      ...(profileData.prenom !== undefined && { prenom: profileData.prenom }),
      ...(profileData.telephone !== undefined && { telephone: profileData.telephone }),
      ...(profileData.avatar_url !== undefined && { avatar_url: profileData.avatar_url }),
      updated_at: new Date().toISOString()
    };

    await updateDoc(profileRef, updatePayload);
    const updatedUser = { ...currentUser, ...updatePayload };
    setCachedUser(updatedUser);
    window.dispatchEvent(new CustomEvent('auth_state_change', { detail: updatedUser }));
    return { data: updatedUser, error: null };
  } catch (error) {
    console.error('Firebase updateProfile error:', error);
    throw error;
  }
}

// Upload profile avatar
export async function uploadAvatar(file) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Aucun utilisateur connecté.");

  if (isMock) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  try {
    const fileExt = file.name.split('.').pop();
    const storageRef = ref(storage, `avatars/${currentUser.id}_${Date.now()}.${fileExt}`);
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Firebase uploadAvatar error:', error);
    throw error;
  }
}

// Fetch admin user ID
export async function getAdminUserId() {
  if (isMock) {
    return 'admin-id';
  }

  try {
    const profilesCol = collection(db, 'profiles');
    const q = query(profilesCol, where('role', '==', 'admin'), limit(1));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }
    return querySnapshot.docs[0].id;
  } catch (err) {
    console.error('getAdminUserId error:', err);
    return null;
  }
}

function getFirebaseErrorMessage(error) {
  switch (error.code) {
    case 'auth/invalid-email':
      return 'Adresse email invalide.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email ou mot de passe incorrect.';
    case 'auth/email-already-in-use':
      return 'Cet email est déjà utilisé par un autre compte.';
    case 'auth/weak-password':
      return 'Le mot de passe doit contenir au moins 6 caractères.';
    default:
      return error.message || 'Une erreur est survenue lors de l\'authentification.';
  }
}
