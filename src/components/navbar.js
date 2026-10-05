import { signOut } from '../services/auth.js';
import { navigate } from '../router.js';

export function renderNavbar(state) {
  const { user, unreadMessagesCount } = state;

  // Render navigation links based on user status
  let authLinksHTML = '';
  if (user) {
    const avatar = user.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

    if (user.role === 'admin') {
      authLinksHTML = `
        <a href="/admin" class="relative text-white/80 hover:text-suv-gold px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 hover:bg-white/5" data-link>
          <span>Console Admin</span>
          ${unreadMessagesCount > 0 ? `
            <span class="flex h-2.5 w-2.5 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-suv-gold opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-suv-gold"></span>
            </span>
          ` : ''}
        </a>
      `;
    } else {
      authLinksHTML = `
        <a href="/dashboard" class="relative text-white/80 hover:text-suv-gold px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 flex items-center gap-2 hover:bg-white/5" data-link>
          <span>Mon Espace VIP</span>
          ${unreadMessagesCount > 0 ? `
            <span class="inline-flex items-center justify-center px-2 py-0.5 text-[10px] font-extrabold leading-none text-black bg-suv-gold rounded-full">
              ${unreadMessagesCount}
            </span>
          ` : ''}
        </a>
      `;
    }

    authLinksHTML += `
      <!-- User Profile & Quick Actions -->
      <div class="relative flex items-center gap-3 pl-4 border-l border-white/10">
        <a href="/dashboard?tab=profile" class="flex items-center gap-2.5 hover:opacity-90 transition-opacity p-1 rounded-full hover:bg-white/5" data-link title="Mon Compte">
          <img class="w-8 h-8 rounded-full border border-suv-gold/40 object-cover shadow-md" src="${avatar}" alt="${user.prenom}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'">
          <span class="hidden lg:inline text-xs font-bold text-white/90 tracking-wide">${user.prenom}</span>
        </a>
        <button id="nav-logout-btn" class="p-2 rounded-xl text-white/50 hover:text-suv-red hover:bg-white/5 transition-all" title="Déconnexion">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
        </button>
      </div>
    `;
  } else {
    authLinksHTML = `
      <div class="flex items-center gap-3">
        <a href="/login" class="btn-premium-gold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-extrabold flex items-center gap-2 shadow-lg" data-link>
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
          <span>Espace Client</span>
        </a>
      </div>
    `;
  }

  return `
    <nav class="fixed top-0 left-0 w-full z-50 glass-panel border-b border-white/10 shadow-2xl transition-all duration-300">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-20">
          
          <!-- Logo & Brand Identity -->
          <div class="flex-shrink-0">
            <a href="/" class="flex items-center gap-3 group" data-link>
              <div class="w-10 h-10 rounded-xl bg-gradient-premium-gold flex items-center justify-center font-black text-black text-xl shadow-lg shadow-suv-gold/25 group-hover:scale-105 transition-transform duration-300">
                V
              </div>
              <div class="flex flex-col">
                <div class="flex items-center gap-1.5">
                  <span class="font-black tracking-wider text-xl font-display text-white">VOBO<span class="text-suv-gold group-hover:text-suv-gold-light transition-colors">KUN</span></span>
                  <span class="text-[9px] font-extrabold tracking-widest text-suv-gold bg-suv-gold/10 border border-suv-gold/20 px-1.5 py-0.5 rounded uppercase">Atelier</span>
                </div>
                <span class="text-[9px] uppercase tracking-widest text-white/40 font-semibold -mt-1 hidden sm:block">Automobiles d'Exception</span>
              </div>
            </a>
          </div>
          
          <!-- Desktop Navigation -->
          <div class="hidden md:flex items-center gap-6">
            <a href="/" class="text-white/80 hover:text-suv-gold px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:bg-white/5" data-link>Accueil</a>
            <a href="/catalogue" class="text-white/80 hover:text-suv-gold px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 hover:bg-white/5 flex items-center gap-1.5" data-link>
              <span>Catalogue</span>
              <span class="text-[9px] bg-white/10 text-white/70 px-1.5 py-0.2 rounded-full font-sans font-bold">8</span>
            </a>
            
            ${authLinksHTML}
            
            <!-- Theme Toggle Desktop -->
            <button id="theme-toggle-btn" class="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-suv-gold/30 text-white/80 hover:text-suv-gold transition-all duration-200" title="Changer de thème (Clair / Sombre)">
              <svg class="w-4 h-4 hidden html-dark-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
              <svg class="w-4 h-4 hidden html-light-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            </button>
          </div>
          
          <!-- Mobile Menu & Theme Controls -->
          <div class="flex md:hidden items-center gap-2.5">
            <!-- Mobile Theme Toggle -->
            <button id="theme-toggle-btn-mobile" class="p-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-suv-gold transition-all" title="Changer de thème">
              <svg class="w-4 h-4 hidden html-dark-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z"/></svg>
              <svg class="w-4 h-4 hidden html-light-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>
            </button>
            
            <button id="mobile-menu-toggle-btn" class="p-2.5 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:text-white hover:bg-white/10 focus:outline-none">
              <svg class="h-5 w-5" id="burger-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
          
        </div>
      </div>
      
      <!-- Mobile Drawer Menu -->
      <div class="hidden md:hidden bg-[#0E1218]/95 backdrop-blur-2xl border-b border-white/10 animate-fade-in" id="mobile-menu">
        <div class="px-4 pt-3 pb-6 space-y-2 flex flex-col">
          <a href="/" class="text-white/85 hover:bg-white/5 hover:text-suv-gold px-3.5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-between" data-link>
            <span>Accueil</span>
            <svg class="w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </a>
          <a href="/catalogue" class="text-white/85 hover:bg-white/5 hover:text-suv-gold px-3.5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-between" data-link>
            <span>Catalogue SUV</span>
            <span class="text-xs bg-suv-gold/20 text-suv-gold px-2 py-0.5 rounded-full font-sans font-bold">8 véhicules</span>
          </a>
          
          ${user ? `
            ${user.role === 'admin' ? `
              <a href="/admin" class="text-white/85 hover:bg-white/5 hover:text-suv-gold px-3.5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-between" data-link>
                <span>Console Concessionnaire</span>
                <span class="text-xs bg-suv-gold text-black font-bold px-2 py-0.5 rounded-full">${unreadMessagesCount} non lus</span>
              </a>
            ` : `
              <a href="/dashboard" class="text-white/85 hover:bg-white/5 hover:text-suv-gold px-3.5 py-3 rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-between" data-link>
                <span>Mon Espace Client VIP</span>
                <span class="text-xs bg-suv-gold text-black font-bold px-2 py-0.5 rounded-full">${unreadMessagesCount} msg</span>
              </a>
            `}
            
            <div class="pt-4 mt-2 border-t border-white/10 flex items-center justify-between px-2">
              <a href="/dashboard?tab=profile" class="flex items-center gap-3 hover:opacity-80" data-link>
                <img class="w-9 h-9 rounded-full border border-suv-gold/30 object-cover" src="${user.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}" alt="${user.prenom}">
                <div>
                  <div class="text-sm text-white font-bold">${user.prenom} ${user.nom}</div>
                  <div class="text-xs text-white/40">${user.telephone || 'Compte Membre'}</div>
                </div>
              </a>
              <button id="mobile-logout-btn" class="text-xs text-suv-red font-bold uppercase tracking-wider hover:underline flex items-center gap-1">
                Déconnexion
              </button>
            </div>
          ` : `
            <div class="pt-3">
              <a href="/login" class="btn-premium-gold text-center block w-full py-3.5 rounded-xl text-xs uppercase tracking-wider font-extrabold shadow-lg" data-link>
                Accéder à l'Espace Client
              </a>
            </div>
          `}
        </div>
      </div>
    </nav>
  `;
}

export function initNavbar() {
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
        burgerIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />`;
      }
    });
  }

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
