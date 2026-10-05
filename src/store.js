// SUV Marketplace State Store (Observer Pattern)
import { getCurrentUser, getCachedUser } from './services/auth.js';

class Store {
  constructor() {
    this.state = {
      user: getCachedUser(), // Synchronous instant user load from local cache
      filters: {
        search: '',
        marque: [],
        prixMin: 0,
        prixMax: 100000000,
        anneeMin: 2015,
        anneeMax: 2026,
        carburant: '',
        transmission: '',
        kilometrageMax: 200000
      },
      unreadMessagesCount: 0,
      initialized: false
    };
    this.listeners = new Set();
  }

  // Add listener for state changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify listeners
  notify() {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  // Get current state
  getState() {
    return this.state;
  }

  // Set user session
  setUser(user) {
    this.state.user = user;
    this.notify();
    if (user) {
      // Async background unread count update
      setTimeout(() => this.updateUnreadCount(), 100);
    } else {
      this.state.unreadMessagesCount = 0;
      this.notify();
    }
  }

  // Set filters
  setFilters(newFilters) {
    this.state.filters = { ...this.state.filters, ...newFilters };
    this.notify();
  }

  // Reset filters
  resetFilters() {
    this.state.filters = {
      search: '',
      marque: [],
      prixMin: 0,
      prixMax: 100000000,
      anneeMin: 2015,
      anneeMax: 2026,
      carburant: '',
      transmission: '',
      kilometrageMax: 200000
    };
    this.notify();
  }

  // Update unread count for badges
  async updateUnreadCount() {
    if (!this.state.user) return;
    
    try {
      if (this.state.user.role === 'admin') {
        const { getConversations } = await import('./services/messages.js');
        const { data: conversations } = await getConversations();
        const count = conversations.reduce((acc, c) => acc + c.unreadCount, 0);
        this.state.unreadMessagesCount = count;
      } else {
        const { getMessages } = await import('./services/messages.js');
        const { getAdminUserId } = await import('./services/auth.js');
        let adminId = 'admin-id';
        const fetchedAdminId = await getAdminUserId();
        if (fetchedAdminId) {
          adminId = fetchedAdminId;
        }
        const { data: messages } = await getMessages(adminId);
        const count = messages.filter(m => m.receiver_id === this.state.user.id && !m.lu).length;
        this.state.unreadMessagesCount = count;
      }
      this.notify();
    } catch (e) {
      console.error('Error updating unread count:', e);
    }
  }

  // Initialize store state on app boot
  async init() {
    if (this.state.initialized) return;
    this.state.initialized = true;

    // Listen to auth status changes
    window.addEventListener('auth_state_change', (e) => {
      this.setUser(e.detail);
    });

    // Check user auth state asynchronously
    getCurrentUser().then(user => {
      this.setUser(user);
    }).catch(console.error);

    // Listen to new messages in real-time
    try {
      const { subscribeToMessages, playNotificationSound } = await import('./services/messages.js');
      subscribeToMessages((newMsg) => {
        const currentUser = this.state.user;
        if (currentUser && newMsg.receiver_id === currentUser.id) {
          this.updateUnreadCount();
          playNotificationSound();
        }
      });
    } catch (e) {
      // ignore
    }
  }
}

export const store = new Store();
