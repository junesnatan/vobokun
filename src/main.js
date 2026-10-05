import { store } from './store.js';
import { initRouter, navigate } from './router.js';
import { renderNavbar, initNavbar } from './components/navbar.js';
import { initComparisonSystem, updateComparisonBar } from './components/comparison.js';
import { isMock, db } from './firebase.js';
import { collection, getDocs } from 'firebase/firestore';

// Global Footer Component HTML
const footerHTML = `
  <div class="border-t border-white/5 bg-black/40 py-12 px-6">
    <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
      
      <!-- Logo and Description -->
      <div class="space-y-4">
        <a href="/" class="flex items-center gap-2" data-link>
          <span class="w-8 h-8 rounded-lg bg-gradient-premium-red flex items-center justify-center font-bold text-white shadow-lg">V</span>
          <span class="font-extrabold tracking-wider text-xl font-display">VOBO<span class="text-suv-gold">KUN</span></span>
        </a>
        <p class="text-sm text-suv-gray max-w-xs leading-relaxed">
          Votre concessionnaire digital haut de gamme. Une sélection rigoureuse des meilleurs SUV du marché avec gestion en temps réel.
        </p>
      </div>
      
      <!-- Links: Catalogue -->
      <div>
        <h4 class="text-sm font-bold uppercase tracking-wider text-white font-display mb-4">Navigation</h4>
        <ul class="space-y-2 text-sm text-suv-gray">
          <li><a href="/" class="hover:text-suv-gold transition-colors" data-link>Accueil</a></li>
          <li><a href="/catalogue" class="hover:text-suv-gold transition-colors" data-link>Catalogue</a></li>
          <li><a href="/login" class="hover:text-suv-gold transition-colors" data-link>Se Connecter</a></li>
        </ul>
      </div>
      
      <!-- Contact Info -->
      <div>
        <h4 class="text-sm font-bold uppercase tracking-wider text-white font-display mb-4">Contact</h4>
        <ul class="space-y-2 text-sm text-suv-gray">
          <li class="flex items-center gap-2">
            <svg class="w-4 h-4 text-suv-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            Haie Vive, Cotonou, Bénin
          </li>
          <li class="flex items-center gap-2">
            <svg class="w-4 h-4 text-suv-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
            +229 01 00 00 00 00
          </li>
          <li class="flex items-center gap-2">
            <svg class="w-4 h-4 text-suv-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            contact@vobokun.com
          </li>
        </ul>
      </div>

      <!-- Legal Info -->
      <div>
        <h4 class="text-sm font-bold uppercase tracking-wider text-white font-display mb-4">Légal</h4>
        <ul class="space-y-2 text-sm text-suv-gray">
          <li><a href="#" class="hover:text-suv-gold transition-colors">Mentions Légales</a></li>
          <li><a href="#" class="hover:text-suv-gold transition-colors">Politique de Confidentialité</a></li>
          <li><a href="#" class="hover:text-suv-gold transition-colors">CGV / CGU</a></li>
        </ul>
      </div>
      
    </div>
    <div class="max-w-7xl mx-auto mt-12 pt-6 border-t border-white/5 text-center text-xs text-suv-gray">
      <p>&copy; 2026 Vobokun. Version 1.0. Tous droits réservés.</p>
    </div>
  </div>
`;

// App startup routine
async function bootstrap() {
  // 1. Boot client routing immediately for instantaneous zero-delay page render
  initRouter();

  // 2. Initialize core state store asynchronously
  store.init().catch(console.error);

  // Initialize Comparison System
  initComparisonSystem();
  updateComparisonBar();

  // 3. Render static layout containers immediately (0ms)
  const navbarContainer = document.getElementById('navbar-view');
  const footerContainer = document.getElementById('footer-view');

  if (navbarContainer) {
    // Redraw navbar on store state changes
    store.subscribe((state) => {
      navbarContainer.innerHTML = renderNavbar(state);
      initNavbar();
    });

    // Initial render
    navbarContainer.innerHTML = renderNavbar(store.getState());
    initNavbar();
  }

  if (footerContainer) {
    const siteTel = localStorage.getItem('suv_site_tel') || '+229 01 00 00 00 00';
    const siteAddr = localStorage.getItem('suv_site_address') || 'Haie Vive, Cotonou, Bénin';
    footerContainer.innerHTML = footerHTML
      .replace('Haie Vive, Cotonou, Bénin', siteAddr)
      .replace('+229 01 00 00 00 00', siteTel);
  }

  // Fetch settings from Firestore asynchronously in background (non-blocking)
  if (!isMock && db) {
    getDocs(collection(db, 'settings')).then(snap => {
      snap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.key && data.value) {
          localStorage.setItem(data.key, data.value);
        }
      });
    }).catch(() => {
      // ignore
    });
  }

  // Boot social proof system
  try {
    const { initSocialProof } = await import('./services/socialProof.js');
    initSocialProof();
  } catch (e) {
    console.error('Failed to initialize social proof:', e);
  }

  // Render floating chat globally
  const chatContainer = document.getElementById('global-chat-view');
  if (chatContainer) {
    const { renderFloatingChat, initFloatingChat } = await import('./components/chat.js');
    
    store.subscribe((state) => {
      const { user } = state;
      if (user && user.role !== 'admin') {
        if (!document.getElementById('floating-chat-container')) {
          chatContainer.innerHTML = renderFloatingChat();
          initFloatingChat();
        }
      } else {
        chatContainer.innerHTML = '';
      }
    });

    // Initial check
    const state = store.getState();
    if (state.user && state.user.role !== 'admin') {
      chatContainer.innerHTML = renderFloatingChat();
      initFloatingChat();
    }
  }

  // 4. Handle OAuth redirection navigation
  const isOAuthRedirect = window.location.hash.includes('access_token=') || 
                          window.location.search.includes('code=');
  if (isOAuthRedirect) {
    const user = store.getState().user;
    if (user) {
      window.history.replaceState(null, null, window.location.pathname);
      navigate(user.role === 'admin' ? '/admin' : '/dashboard');
    }
  }
}

bootstrap();
