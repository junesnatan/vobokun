import { signOut } from '../services/auth.js';
import { navigate } from '../router.js';

export function renderNavbar(state) {
  const { user, unreadMessagesCount } = state;

  // Render navigation links based on user status
  let authLinksHTML = '';
  if (user) {
    const avatar = user.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
    const initials = `${user.prenom[0] || ''}${user.nom[0] || ''}`.toUpperCase();

    if (user.role === 'admin') {
      authLinksHTML = `
        <a href="/admin" class="relative text-white/80 hover:text-suv-gold px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1.5" data-link>
          Console Admin
          ${unreadMessagesCount > 0 ? `
            <span class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-suv-gold opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-suv-gold"></span>
            </span>
          ` : ''}
        </a>
      `;
    } else {
      authLinksHTML = `
        <a href="/dashboard" class="relative text-white/80 hover:text-suv-gold px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-1.5" data-link>
          Mon Tableau de Bord
          ${unreadMessagesCount > 0 ? `
            <span class="inline-flex items-center justify-center px-2 py-0.5 text-xxs font-extrabold leading-none text-suv-red bg-suv-gold rounded-full animate-bounce">
              ${unreadMessagesCount}
            </span>
          ` : ''}
        </a>
      `;
    }

    authLinksHTML += `
      <!-- User profile & Logout -->
      <div class="relative flex items-center gap-4 ml-2 pl-4 border-l border-white/10">
        <a href="/dashboard?tab=profile" class="flex items-center gap-2 hover:opacity-80 transition-opacity" data-link title="Gérer mon profil / ma photo">
          <img class="w-8 h-8 rounded-full border border-suv-gold/30 object-cover" src="${avatar}" alt="${user.prenom}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'">
          <span class="hidden lg:inline text-sm font-medium text-white/90">${user.prenom}</span>
        </a>
        <button id="nav-logout-btn" class="text-sm text-suv-gray hover:text-suv-red font-medium transition-colors duration-200 flex items-center gap-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
          <span class="hidden md:inline">Déconnexion</span>
        </button>
      </div>
    `;
  } else {
    authLinksHTML = `
      <a href="/login" class="bg-gradient-premium-red hover:shadow-lg hover:shadow-suv-red/20 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200" data-link>
        Espace Client
      </a>
    `;
  }

  return `
    <nav class="fixed top-0 left-0 w-full z-50 glass-panel border-b border-white/5 shadow-2xl">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          
          <!-- Logo -->
          <div class="flex-shrink-0">
            <a href="/" class="flex items-center gap-2.5 group" data-link>
              <span class="w-10 h-10 rounded-xl bg-gradient-premium-red flex items-center justify-center font-black text-white text-lg shadow-xl shadow-suv-red/20 group-hover:scale-105 transition-transform duration-300">V</span>
              <span class="font-extrabold tracking-wider text-xl font-display text-white">VOBO<span class="text-suv-gold transition-colors duration-300 group-hover:text-suv-yellow">KUN</span></span>
            </a>
          </div>
          
          <!-- Desktop navigation -->
          <div class="hidden md:flex items-center gap-8">
            <a href="/" class="text-white/80 hover:text-suv-gold px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200" data-link>Accueil</a>
            <a href="/catalogue" class="text-white/80 hover:text-suv-gold px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200" data-link>Catalogue</a>
            ${authLinksHTML}
            
            <!-- Theme Toggle Desktop -->
            <button id="theme-toggle-btn" class="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white/80 hover:text-white transition-all duration-200" title="Changer de thème">
              <svg class="w-4 h-4 hidden html-dark-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
              <svg class="w-4 h-4 hidden html-light-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            </button>
          </div>
          
          <!-- Mobile Menu Hamburger button & Theme Toggle -->
          <div class="flex md:hidden items-center gap-3">
            <!-- Theme Toggle Mobile -->
            <button id="theme-toggle-btn-mobile" class="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-white/80 hover:text-white transition-all duration-200" title="Changer de thème">
              <svg class="w-4 h-4 hidden html-dark-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
              <svg class="w-4 h-4 hidden html-light-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            </button>
            
            <button id="mobile-menu-toggle-btn" class="inline-flex items-center justify-center p-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-suv-darker focus:ring-suv-gold">
              <svg class="h-6 w-6" id="burger-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
        </div>
      </div>
      
      <!-- Mobile Menu -->
      <div class="hidden md:hidden bg-suv-dark/95 border-b border-white/5 animate-fade-in" id="mobile-menu">
        <div class="px-2 pt-2 pb-4 space-y-1 sm:px-3 flex flex-col gap-2">
          <a href="/" class="text-white/85 hover:bg-white/5 hover:text-suv-gold block px-3 py-2.5 rounded-md text-base font-medium" data-link>Accueil</a>
          <a href="/catalogue" class="text-white/85 hover:bg-white/5 hover:text-suv-gold block px-3 py-2.5 rounded-md text-base font-medium" data-link>Catalogue</a>
          
          ${user ? `
            ${user.role === 'admin' ? `
              <a href="/admin" class="text-white/85 hover:bg-white/5 hover:text-suv-gold block px-3 py-2.5 rounded-md text-base font-medium" data-link>Console Admin (${unreadMessagesCount})</a>
            ` : `
              <a href="/dashboard" class="text-white/85 hover:bg-white/5 hover:text-suv-gold block px-3 py-2.5 rounded-md text-base font-medium" data-link>Mon Espace (${unreadMessagesCount})</a>
            `}
            
            <div class="pt-4 border-t border-white/5 flex items-center justify-between px-3">
              <a href="/dashboard?tab=profile" class="flex items-center gap-2 hover:opacity-80 transition-opacity" data-link title="Gérer mon profil / ma photo">
                <img class="w-8 h-8 rounded-full border border-suv-gold/30 object-cover" src="${user.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}" alt="${user.prenom}">
                <span class="text-sm text-white/90 font-medium">${user.prenom} ${user.nom}</span>
              </a>
              <button id="mobile-logout-btn" class="text-sm text-suv-red font-medium flex items-center gap-1">
                Déconnexion
              </button>
            </div>
          ` : `
            <a href="/login" class="bg-gradient-premium-red text-center text-white block mx-3 my-2 py-3 rounded-lg text-base font-semibold" data-link>Espace Client</a>
          `}
        </div>
      </div>
    </nav>
  `;
}

export function initNavbar() {
  // Theme toggle logic (Desktop & Mobile)
  const toggleTheme = () => {
    const isLight = document.documentElement.classList.contains('light');
    if (isLight) {
      document.documentElement.classList.remove('light');
      localStorage.setItem('suv_theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      localStorage.setItem('suv_theme', 'light');
    }
  };

  const themeBtn = document.getElementById('theme-toggle-btn');
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  const themeBtnMobile = document.getElementById('theme-toggle-btn-mobile');
  if (themeBtnMobile) themeBtnMobile.addEventListener('click', toggleTheme);

  // Toggle mobile menu
  const menuBtn = document.getElementById('mobile-menu-toggle-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const burgerIcon = document.getElementById('burger-icon');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isHidden = mobileMenu.classList.contains('hidden');
      if (isHidden) {
        mobileMenu.classList.remove('hidden');
        burgerIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`;
      } else {
        mobileMenu.classList.add('hidden');
        burgerIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />;`;
      }
    });
  }

  // Handle Logouts (Desktop & Mobile)
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const logoutBtn = document.getElementById('nav-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);
}
