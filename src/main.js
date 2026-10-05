import { store } from './store.js';
import { initRouter, navigate } from './router.js';
import { renderNavbar, initNavbar } from './components/navbar.js';
import { initComparisonSystem, updateComparisonBar } from './components/comparison.js';
import { isMock, db } from './firebase.js';
import { collection, getDocs } from 'firebase/firestore';

// Global Toyota Corporate Footer HTML
const footerHTML = `
  <footer class="toyota-footer py-5 border-top">
    <div class="container">
      
      <!-- Trust badges ribbon -->
      <div class="row row-cols-1 row-cols-sm-2 row-cols-md-4 g-4 pb-4 mb-5 border-bottom border-secondary border-opacity-25">
        <div class="col">
          <div class="d-flex align-items-center gap-3">
            <div class="rounded-3 d-flex align-items-center justify-content-center text-danger flex-shrink-0" style="width: 46px; height: 46px; background: rgba(235, 10, 30, 0.1); border: 1px solid rgba(235, 10, 30, 0.25);">
              <i class="bi bi-shield-check fs-4"></i>
            </div>
            <div>
              <div class="small fw-black text-uppercase text-white" style="letter-spacing: 0.05em;">Inspection 150 pts</div>
              <div class="small text-white-50" style="font-size: 0.75rem;">Contrôle certifié rigoureux</div>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="d-flex align-items-center gap-3">
            <div class="rounded-3 d-flex align-items-center justify-content-center text-danger flex-shrink-0" style="width: 46px; height: 46px; background: rgba(235, 10, 30, 0.1); border: 1px solid rgba(235, 10, 30, 0.25);">
              <i class="bi bi-clock-history fs-4"></i>
            </div>
            <div>
              <div class="small fw-black text-uppercase text-white" style="letter-spacing: 0.05em;">Garantie 12 Mois</div>
              <div class="small text-white-50" style="font-size: 0.75rem;">Pièces et main d'œuvre</div>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="d-flex align-items-center gap-3">
            <div class="rounded-3 d-flex align-items-center justify-content-center text-danger flex-shrink-0" style="width: 46px; height: 46px; background: rgba(235, 10, 30, 0.1); border: 1px solid rgba(235, 10, 30, 0.25);">
              <i class="bi bi-cash-coin fs-4"></i>
            </div>
            <div>
              <div class="small fw-black text-uppercase text-white" style="letter-spacing: 0.05em;">Prix Transparents</div>
              <div class="small text-white-50" style="font-size: 0.75rem;">Négociation directe showroom</div>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="d-flex align-items-center gap-3">
            <div class="rounded-3 d-flex align-items-center justify-content-center text-danger flex-shrink-0" style="width: 46px; height: 46px; background: rgba(235, 10, 30, 0.1); border: 1px solid rgba(235, 10, 30, 0.25);">
              <i class="bi bi-truck fs-4"></i>
            </div>
            <div>
              <div class="small fw-black text-uppercase text-white" style="letter-spacing: 0.05em;">Livraison VIP</div>
              <div class="small text-white-50" style="font-size: 0.75rem;">Cotonou et partout au Bénin</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Links Grid -->
      <div class="row g-4 mb-5">
        
        <!-- Logo and Description -->
        <div class="col-12 col-md-4">
          <a href="/" class="d-flex align-items-center gap-2 text-decoration-none mb-3" data-link>
            <div class="rounded-3 d-flex align-items-center justify-content-center fw-black text-white" style="width: 38px; height: 38px; background: var(--toyota-red);">V</div>
            <span class="fw-black text-white fs-4 font-display" style="letter-spacing: 0.08em;">VOBO<span class="text-danger">KUN</span></span>
          </a>
          <p class="small text-white-50 mb-0 lh-lg pe-md-4" style="font-size: 0.8rem;">
            Le showroom digital de référence pour les SUV de prestige et d'occasion certifiés. Une expérience corporate sécurisée, fluide et réactive aux normes 2026.
          </p>
        </div>
        
        <!-- Showroom Links -->
        <div class="col-6 col-md-2">
          <h6 class="fw-black text-uppercase text-danger mb-3 font-display" style="font-size: 0.75rem; letter-spacing: 0.08em;">Showroom</h6>
          <ul class="list-unstyled small d-grid gap-2 mb-0" style="font-size: 0.8rem;">
            <li><a href="/" class="text-white-50 text-decoration-none" data-link>Accueil</a></li>
            <li><a href="/catalogue" class="text-white-50 text-decoration-none" data-link>Catalogue Complet</a></li>
            <li><a href="/login" class="text-white-50 text-decoration-none" data-link>Espace Client VIP</a></li>
          </ul>
        </div>
        
        <!-- Contact Info -->
        <div class="col-6 col-md-3">
          <h6 class="fw-black text-uppercase text-danger mb-3 font-display" style="font-size: 0.75rem; letter-spacing: 0.08em;">Showroom Privé</h6>
          <ul class="list-unstyled small d-grid gap-2 mb-0 text-white-50" style="font-size: 0.8rem;">
            <li class="d-flex align-items-center gap-2">
              <i class="bi bi-geo-alt-fill text-danger"></i>
              <span>Haie Vive, Cotonou, Bénin</span>
            </li>
            <li class="d-flex align-items-center gap-2">
              <i class="bi bi-telephone-fill text-danger"></i>
              <span>+229 01 00 00 00 00</span>
            </li>
            <li class="d-flex align-items-center gap-2">
              <i class="bi bi-envelope-fill text-danger"></i>
              <span>contact@vobokun.com</span>
            </li>
          </ul>
        </div>

        <!-- Engagements -->
        <div class="col-12 col-md-3">
          <h6 class="fw-black text-uppercase text-danger mb-3 font-display" style="font-size: 0.75rem; letter-spacing: 0.08em;">Engagements</h6>
          <ul class="list-unstyled small d-grid gap-2 mb-0" style="font-size: 0.8rem;">
            <li><a href="#" class="text-white-50 text-decoration-none">Charte Qualité Vobokun</a></li>
            <li><a href="#" class="text-white-50 text-decoration-none">Politique de Confidentialité</a></li>
            <li><a href="#" class="text-white-50 text-decoration-none">Mentions Légales & CGV</a></li>
          </ul>
        </div>
        
      </div>
      
      <!-- Bottom Bar -->
      <div class="pt-4 border-top border-secondary border-opacity-25 d-flex flex-column flex-sm-row align-items-center justify-content-between gap-3 text-white-50 small" style="font-size: 0.75rem;">
        <div>&copy; 2026 Vobokun Atelier Automobiles. Tous droits réservés.</div>
        <div class="d-flex align-items-center gap-2">
          <span class="rounded-circle bg-success d-inline-block" style="width: 8px; height: 8px;"></span>
          <span>Système opérationnel &middot; Haute Disponibilité</span>
        </div>
      </div>

    </div>
  </footer>
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
