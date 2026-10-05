import { db, storage, isMock, mockDb } from '../firebase.js';
import { getCurrentUser } from './auth.js';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Send a chat message
export async function sendMessage(receiverId, contenu, vehicleId = null) {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Vous devez être connecté pour envoyer un message.");

  const messageData = {
    id: 'msg-' + Math.random().toString(36).substr(2, 9),
    sender_id: currentUser.id,
    receiver_id: receiverId,
    vehicle_id: vehicleId,
    contenu,
    lu: false,
    created_at: new Date().toISOString()
  };

  // Always save locally first for instant real-time response
  const messages = mockDb.getCollection(mockDb.KEYS.MESSAGES);
  messages.push(messageData);
  mockDb.saveCollection(mockDb.KEYS.MESSAGES, messages);
  window.dispatchEvent(new CustomEvent('mock_message_received', { detail: messageData }));

  try {
    const bc = new BroadcastChannel('suv-mock-messages');
    bc.postMessage(messageData);
    bc.close();
  } catch (e) {
    // ignore
  }

  // Background Firestore sync
  if (!isMock && db) {
    try {
      addDoc(collection(db, 'messages'), messageData).catch(err => {
        console.warn('Firestore sendMessage background sync error:', err.message);
      });
    } catch (err) {
      // ignore
    }
  }

  return { data: messageData, error: null };
}

// Get message history between current user and target user
export async function getMessages(otherUserId) {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { data: [], error: null };

  if (isMock) {
    const messages = mockDb.getCollection(mockDb.KEYS.MESSAGES);
    const filtered = messages.filter(m => 
      (m.sender_id === currentUser.id && m.receiver_id === otherUserId) ||
      (m.sender_id === otherUserId && m.receiver_id === currentUser.id)
    );
    
    let changed = false;
    filtered.forEach(m => {
      if (m.receiver_id === currentUser.id && !m.lu) {
        m.lu = true;
        changed = true;
      }
    });
    if (changed) {
      mockDb.saveCollection(mockDb.KEYS.MESSAGES, messages);
    }
    
    filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    return { data: filtered, error: null };
  }

  try {
    const messagesCol = collection(db, 'messages');
    const querySnapshot = await getDocs(messagesCol);

    const filtered = [];
    querySnapshot.forEach(docSnap => {
      const m = { id: docSnap.id, ...docSnap.data() };
      if ((m.sender_id === currentUser.id && m.receiver_id === otherUserId) ||
          (m.sender_id === otherUserId && m.receiver_id === currentUser.id)) {
        filtered.push(m);
      }
    });

    filtered.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

    // Mark unread messages as read
    filtered.forEach(async m => {
      if (m.receiver_id === currentUser.id && !m.lu) {
        m.lu = true;
        try {
          await updateDoc(doc(db, 'messages', m.id), { lu: true });
        } catch (e) {
          // ignore
        }
      }
    });

    return { data: filtered, error: null };
  } catch (err) {
    console.warn('getMessages Firestore fallback to local:', err.message);
    const messages = mockDb.getCollection(mockDb.KEYS.MESSAGES);
    const filtered = messages.filter(m => 
      (m.sender_id === currentUser.id && m.receiver_id === otherUserId) ||
      (m.sender_id === otherUserId && m.receiver_id === currentUser.id)
    ).sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    return { data: filtered, error: null };
  }
}

// Get all threads grouped by user (Admin only)
export async function getConversations() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return { data: [], error: null };

  const getLocalThreads = () => {
    const messages = mockDb.getCollection(mockDb.KEYS.MESSAGES);
    const profiles = mockDb.getCollection(mockDb.KEYS.PROFILES);
    const adminId = currentUser.id;

    const threadsMap = {};

    messages.forEach(m => {
      const otherId = m.sender_id === adminId ? m.receiver_id : m.sender_id;
      if (otherId === adminId) return;

      const contact = profiles.find(p => p.id === otherId);
      if (!contact) return;

      if (!threadsMap[otherId] || new Date(m.created_at) > new Date(threadsMap[otherId].lastMessage.created_at)) {
        threadsMap[otherId] = {
          contact,
          lastMessage: m,
          unreadCount: 0
        };
      }
    });

    messages.forEach(m => {
      if (m.receiver_id === adminId && !m.lu) {
        const contactId = m.sender_id;
        if (threadsMap[contactId]) {
          threadsMap[contactId].unreadCount++;
        }
      }
    });

    const threads = Object.values(threadsMap);
    threads.sort((a, b) => new Date(b.lastMessage.created_at || 0) - new Date(a.lastMessage.created_at || 0));
    return threads;
  };

  if (isMock || !db) {
    return { data: getLocalThreads(), error: null };
  }

  try {
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 1800));
    const messagesSnapPromise = getDocs(collection(db, 'messages'));
    const messagesSnap = await Promise.race([messagesSnapPromise, timeoutPromise]);
    const profilesSnap = await getDocs(collection(db, 'profiles')).catch(() => null);

    const messages = [];
    messagesSnap.forEach(d => messages.push({ id: d.id, ...d.data() }));

    const profiles = [];
    if (profilesSnap) {
      profilesSnap.forEach(d => profiles.push({ id: d.id, ...d.data() }));
    }

    const adminId = currentUser.id;
    const threadsMap = {};

    messages.forEach(m => {
      const otherId = m.sender_id === adminId ? m.receiver_id : m.sender_id;
      if (otherId === adminId) return;

      if (!threadsMap[otherId]) {
        const contact = profiles.find(p => p.id === otherId);
        threadsMap[otherId] = {
          contact: contact || { id: otherId, prenom: 'Utilisateur', nom: 'Inconnu' },
          lastMessage: m,
          unreadCount: 0
        };
      } else {
        if (new Date(m.created_at || 0) > new Date(threadsMap[otherId].lastMessage.created_at || 0)) {
          threadsMap[otherId].lastMessage = m;
        }
      }
    });

    messages.forEach(m => {
      if (m.receiver_id === adminId && !m.lu) {
        const otherId = m.sender_id;
        if (threadsMap[otherId]) {
          threadsMap[otherId].unreadCount++;
        }
      }
    });

    const threads = Object.values(threadsMap);
    threads.sort((a, b) => new Date(b.lastMessage.created_at || 0) - new Date(a.lastMessage.created_at || 0));

    if (threads.length > 0) {
      return { data: threads, error: null };
    }
    return { data: getLocalThreads(), error: null };
  } catch (err) {
    console.warn('getConversations Firestore fallback to local:', err.message);
    return { data: getLocalThreads(), error: null };
  }
}

// Subscribe to messages in real-time
export function subscribeToMessages(callback) {
  const handleMockMessage = (e) => callback(e.detail);
  window.addEventListener('mock_message_received', handleMockMessage);

  let bc = null;
  let handleBcMessage = null;
  try {
    bc = new BroadcastChannel('suv-mock-messages');
    handleBcMessage = (e) => callback(e.data);
    bc.addEventListener('message', handleBcMessage);
  } catch (err) {
    // ignore
  }

  let unsubscribeFirestore = () => {};
  if (!isMock && db) {
    try {
      unsubscribeFirestore = onSnapshot(collection(db, 'messages'), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newMsg = { id: change.doc.id, ...change.doc.data() };
            callback(newMsg);
          }
        });
      }, () => {});
    } catch (err) {
      // ignore
    }
  }

  return () => {
    window.removeEventListener('mock_message_received', handleMockMessage);
    if (bc) {
      if (handleBcMessage) bc.removeEventListener('message', handleBcMessage);
      bc.close();
    }
    unsubscribeFirestore();
  };
}

// Real-time typing status via BroadcastChannel
export function subscribeToTyping(clientId, callback) {
  const bc = new BroadcastChannel(`suv-typing-${clientId}`);
  const handleBcMessage = (e) => {
    callback(e.data);
  };
  bc.addEventListener('message', handleBcMessage);
  return () => {
    bc.removeEventListener('message', handleBcMessage);
    bc.close();
  };
}

export async function broadcastTyping(clientId, typingState) {
  const currentUser = await getCurrentUser();
  const senderId = currentUser ? currentUser.id : 'anonymous';
  const isTyping = !!typingState;

  const bc = new BroadcastChannel(`suv-typing-${clientId}`);
  bc.postMessage({ isTyping, typingState, sender_id: senderId });
  bc.close();
}

// Programmatically play a clean luxury ping notification sound
export function playNotificationSound() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    const context = new AudioContextClass();
    const playTone = (freq, type, startOffset, duration, volume) => {
      const osc = context.createOscillator();
      const gain = context.createGain();
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, context.currentTime + startOffset);
      
      gain.gain.setValueAtTime(0, context.currentTime + startOffset);
      gain.gain.linearRampToValueAtTime(volume, context.currentTime + startOffset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + startOffset + duration);
      
      osc.connect(gain);
      gain.connect(context.destination);
      
      osc.start(context.currentTime + startOffset);
      osc.stop(context.currentTime + startOffset + duration);
    };

    playTone(987.77, 'triangle', 0, 0.25, 0.08);
    playTone(1975.53, 'sine', 0.01, 0.20, 0.03);
    playTone(1567.98, 'sine', 0.06, 0.30, 0.08);
    playTone(2093.00, 'sine', 0.12, 0.40, 0.10);
    playTone(4186.01, 'sine', 0.13, 0.25, 0.02);
  } catch (e) {
    console.warn('AudioContext playback blocked or not supported:', e);
  }
}

// Upload recorded voice note file
export async function uploadVoiceNote(audioBlob) {
  if (isMock) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });
  }

  try {
    const fileName = `voice-notes/${Math.random().toString(36).substr(2, 9)}-${Date.now()}.webm`;
    const storageRef = ref(storage, fileName);
    await uploadBytes(storageRef, audioBlob, { contentType: 'audio/webm' });
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Failed to upload voice note to Firebase storage:', error);
    throw error;
  }
}
