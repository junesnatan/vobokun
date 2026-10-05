import { store } from './store.js';

// Route mappings
// We import page modules dynamically to enable code-splitting and faster load times.
const routes = [
  {
    path: /^\/$/,
    module: () => import('./pages/home.js'),
    name: 'home',
    title: 'Vobokun | Showroom de Prestige'
  },
  {
    path: /^\/catalogue$/,
    module: () => import('./pages/catalogue.js'),
    name: 'catalogue',
    title: 'Catalogue | Vobokun'
  },
  {
    path: /^\/vehicle\/([^/]+)$/,
    module: () => import('./pages/vehicle.js'),
    name: 'vehicle',
    title: 'Détails du Véhicule | Vobokun',
    paramsKey: ['id']
  },
  {
    path: /^\/login$/,
    module: () => import('./pages/login.js'),
    name: 'login',
    title: 'Connexion / Inscription | Vobokun',
    guestOnly: true
  },
  {
    path: /^\/dashboard$/,
    module: () => import('./pages/dashboard-user.js'),
    name: 'dashboard',
    title: 'Mon Espace Client | Vobokun',
    authRequired: true
  },
  {
    path: /^\/admin$/,
    module: () => import('./pages/dashboard-admin.js'),
    name: 'admin',
    title: 'Console Administrateur | Vobokun',
    adminRequired: true
  }
];

// Navigate to a new route programmatically
export function navigate(path) {
  window.history.pushState({}, '', path);
  handleRouting();
}

// Extract current route information
function resolveRoute() {
  const path = window.location.pathname;
  
  for (const route of routes) {
    const match = path.match(route.path);
    if (match) {
      const params = {};
      if (route.paramsKey) {
        route.paramsKey.forEach((key, index) => {
          params[key] = match[index + 1];
        });
      }
      return { route, params };
    }
  }
  return null;
}

// Main router logic
async function handleRouting() {
  const container = document.getElementById('router-view');
  if (!container) return;

  const resolved = resolveRoute();

  if (!resolved) {
    // 404 handler
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 class="text-7xl font-extrabold text-suv-red tracking-tight animate-bounce">404</h1>
        <p class="text-2xl font-bold text-white mt-4">Page Introuvable</p>
        <p class="text-suv-gray mt-2 max-w-md">Le véhicule ou la page que vous recherchez n'existe pas ou a été déplacé.</p>
        <a href="/" class="mt-8 bg-suv-red hover:bg-suv-purple text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200 shadow-lg" data-link>
          Retour à l'accueil
        </a>
      </div>
    `;
    return;
  }

  const { route, params } = resolved;
  const state = store.getState();

  // ROUTE GUARDS
  // Guest-only routes (e.g. login/register)
  if (route.guestOnly && state.user) {
    navigate(state.user.role === 'admin' ? '/admin' : '/dashboard');
    return;
  }

  // Auth required routes (dashboard)
  if (route.authRequired && !state.user) {
    navigate('/login');
    return;
  }

  // Admin required routes (admin panel)
  if (route.adminRequired) {
    if (!state.user) {
      navigate('/login');
      return;
    }
    if (state.user.role !== 'admin') {
      // 403 Forbidden screen
      container.innerHTML = `
        <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div class="p-4 bg-suv-red/10 rounded-full border border-suv-red/30">
            <svg class="w-16 h-16 text-suv-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m12 3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 class="text-4xl font-bold text-white mt-6">Accès Refusé (403)</h1>
          <p class="text-suv-gray mt-2 max-w-md">Vous n'avez pas les droits nécessaires pour accéder à l'espace d'administration.</p>
          <a href="/" class="mt-8 border-2 border-suv-red text-suv-red hover:bg-suv-red hover:text-white px-8 py-3 rounded-lg font-semibold transition-all duration-200" data-link>
            Retourner au site public
          </a>
        </div>
      `;
      return;
    }
  }

  // Clear global chat vehicle context by default on routing
  try {
    const { updateChatVehicleContext } = await import('./components/chat.js');
    updateChatVehicleContext(null);
  } catch (e) {
    // ignore
  }

  try {
    // Document title
    document.title = route.title;

    // Load module and run render immediately
    const pageModule = await route.module();
    container.innerHTML = pageModule.render(params);
    
    // Initialize page events/animations
    if (typeof pageModule.init === 'function') {
      pageModule.init(params);
    }

    // Restore scroll top
    window.scrollTo(0, 0);

    // Trigger navigation link active classes update
    updateActiveNavLinks();

    // Show container immediately
    container.classList.remove('opacity-0', 'translate-y-2');
    container.classList.add('opacity-100');
  } catch (err) {
    console.error('Failed to load page module:', err);
    container.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h2 class="text-2xl font-bold text-white">Erreur de Chargement</h2>
        <p class="text-suv-gray mt-2">Une erreur est survenue lors de l'affichage de cette page. Veuillez rafraîchir.</p>
        <button onclick="window.location.reload()" class="mt-6 bg-suv-red hover:bg-suv-purple text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-200">
          Rafraîchir
        </button>
      </div>
    `;
    container.classList.remove('opacity-0', 'translate-y-2');
  }
}

// Update active states in CSS navigation items
export function updateActiveNavLinks() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('[data-link]').forEach(link => {
    const linkPath = link.getAttribute('href');
    if (linkPath === currentPath) {
      link.classList.add('text-suv-gold', 'font-bold');
      link.classList.remove('text-white/80');
    } else {
      link.classList.remove('text-suv-gold', 'font-bold');
      link.classList.add('text-white/80');
    }
  });
}

// Initialize Router listeners
export function initRouter() {
  // Catch link clicks
  document.body.addEventListener('click', e => {
    const link = e.target.closest('a[data-link]');
    if (link) {
      e.preventDefault();
      const href = link.getAttribute('href');
      navigate(href);
    }
  });

  // Watch back/forward history events
  window.addEventListener('popstate', handleRouting);

  // Run initial routing on DOM loaded
  handleRouting();
}
