import { store } from './store.js';
import { initRouter, navigate } from './router.js';
import { renderNavbar, initNavbar } from './components/navbar.js';
import { initComparisonSystem, updateComparisonBar } from './components/comparison.js';
import { isMock, db } from './firebase.js';
import { collection, getDocs } from 'firebase/firestore';

// Global Footer Component HTML
const footerHTML = `
  <div class="global-footer-container border-t border-white/10 bg-[#080A0E] pt-16 pb-12 px-6">
    <div class="max-w-7xl mx-auto space-y-12">
      
      <!-- Trust badges ribbon -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 border-b border-white/5">
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-suv-gold/10 border border-suv-gold/20 flex items-center justify-center text-suv-gold flex-shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <div>
            <div class="text-xs font-black uppercase tracking-wider text-white">Inspection 150 pts</div>
            <div class="text-[11px] text-suv-gray">Contrôle technique certifié</div>
          </div>
        </div>
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-suv-gold/10 border border-suv-gold/20 flex items-center justify-center text-suv-gold flex-shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <div>
            <div class="text-xs font-black uppercase tracking-wider text-white">Garantie 12 Mois</div>
            <div class="text-[11px] text-suv-gray">Pièces et main d'œuvre</div>
          </div>
        </div>
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-suv-gold/10 border border-suv-gold/20 flex items-center justify-center text-suv-gold flex-shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
          </div>
          <div>
            <div class="text-xs font-black uppercase tracking-wider text-white">Prix Transparents</div>
            <div class="text-[11px] text-suv-gray">Négociation directe sans intermédiaire</div>
          </div>
        </div>
        <div class="flex items-center gap-3.5">
          <div class="w-10 h-10 rounded-xl bg-suv-gold/10 border border-suv-gold/20 flex items-center justify-center text-suv-gold flex-shrink-0">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
          </div>
          <div>
            <div class="text-xs font-black uppercase tracking-wider text-white">Livraison VIP</div>
            <div class="text-[11px] text-suv-gray">Cotonou et partout au Bénin</div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-10">
        
        <!-- Logo and Description -->
        <div class="space-y-4">
          <a href="/" class="flex items-center gap-3 group" data-link>
            <div class="w-9 h-9 rounded-xl bg-gradient-premium-gold flex items-center justify-center font-black text-black text-lg shadow-md">V</div>
            <span class="font-black tracking-wider text-xl font-display text-white">VOBO<span class="text-suv-gold">KUN</span></span>
          </a>
          <p class="text-xs text-suv-gray max-w-xs leading-relaxed">
            Le showroom digital de référence pour les SUV de prestige et d'occasion certifiés. Une expérience d'achat sécurisée, transparente et rapide.
          </p>
        </div>
        
        <!-- Links: Navigation -->
        <div>
          <h4 class="text-xs font-extrabold uppercase tracking-widest text-suv-gold font-display mb-4">Showroom</h4>
          <ul class="space-y-2.5 text-xs text-suv-gray font-medium">
            <li><a href="/" class="hover:text-suv-gold transition-colors" data-link>Accueil</a></li>
            <li><a href="/catalogue" class="hover:text-suv-gold transition-colors" data-link>Catalogue Complet</a></li>
            <li><a href="/login" class="hover:text-suv-gold transition-colors" data-link>Espace Client VIP</a></li>
          </ul>
        </div>
        
        <!-- Contact Info -->
        <div>
          <h4 class="text-xs font-extrabold uppercase tracking-widest text-suv-gold font-display mb-4">Showroom Privé</h4>
          <ul class="space-y-2.5 text-xs text-suv-gray font-medium">
            <li class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-suv-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              Haie Vive, Cotonou, Bénin
            </li>
            <li class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-suv-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
              +229 01 00 00 00 00
            </li>
            <li class="flex items-center gap-2.5">
              <svg class="w-4 h-4 text-suv-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
              contact@vobokun.com
            </li>
          </ul>
        </div>

        <!-- Legal Info -->
        <div>
          <h4 class="text-xs font-extrabold uppercase tracking-widest text-suv-gold font-display mb-4">Engagements</h4>
          <ul class="space-y-2.5 text-xs text-suv-gray font-medium">
            <li><a href="#" class="hover:text-suv-gold transition-colors">Charte Qualité Vobokun</a></li>
            <li><a href="#" class="hover:text-suv-gold transition-colors">Politique de Confidentialité</a></li>
            <li><a href="#" class="hover:text-suv-gold transition-colors">Mentions Légales & CGV</a></li>
          </ul>
        </div>
        
      </div>
      
      <div class="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-suv-gray font-medium">
        <p>&copy; 2026 Vobokun Atelier Automobiles. Tous droits réservés.</p>
        <p class="flex items-center gap-2">
          <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
          Système opérationnel &middot; Mode Haute Vitesse
        </p>
      </div>

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
