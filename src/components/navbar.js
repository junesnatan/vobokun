import { signOut } from '../services/auth.js';
import { navigate } from '../router.js';

export function renderNavbar(state) {
  const { user, unreadMessagesCount } = state;

  let authLinksHTML = '';
  if (user) {
    const avatar = user.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

    if (user.role === 'admin') {
      authLinksHTML = `
        <a href="/admin" class="toyota-nav-link position-relative" data-link>
          <i class="bi bi-speedometer2 text-danger"></i>
          <span>Console Concessionnaire</span>
          ${unreadMessagesCount > 0 ? `
            <span class="badge rounded-pill bg-danger ms-1">${unreadMessagesCount}</span>
          ` : ''}
        </a>
      `;
    } else {
      authLinksHTML = `
        <a href="/dashboard" class="toyota-nav-link position-relative" data-link>
          <i class="bi bi-person-badge text-danger"></i>
          <span>Mon Espace VIP</span>
          ${unreadMessagesCount > 0 ? `
            <span class="badge rounded-pill bg-danger ms-1">${unreadMessagesCount}</span>
          ` : ''}
        </a>
      `;
    }

    authLinksHTML += `
      <!-- User Profile & Quick Actions -->
      <div class="d-flex align-items-center gap-2 ps-3 border-start ms-2">
        <a href="/dashboard?tab=profile" class="d-flex align-items-center gap-2 text-decoration-none text-dark fw-bold" data-link title="Mon Compte">
          <img class="rounded-circle border border-2 border-danger" style="width: 34px; height: 34px; object-fit: cover;" src="${avatar}" alt="${user.prenom}" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'">
          <span class="d-none d-xl-inline small fw-bold">${user.prenom}</span>
        </a>
        <button id="nav-logout-btn" class="btn btn-sm btn-outline-secondary border-0 p-1 rounded-circle" title="Déconnexion">
          <i class="bi bi-box-arrow-right fs-6"></i>
        </button>
      </div>
    `;
  } else {
    authLinksHTML = `
      <div class="d-flex align-items-center ms-lg-2">
        <a href="/login" class="btn-toyota-red" data-link>
          <i class="bi bi-person-lock"></i>
          <span>Espace Client</span>
        </a>
      </div>
    `;
  }

  return `
    <nav class="navbar navbar-expand-lg toyota-navbar sticky-top">
      <div class="container px-3 px-sm-4">
        
        <!-- Brand Logo & Toyota-inspired Identity -->
        <a href="/" class="navbar-brand d-flex align-items-center gap-2 text-decoration-none" data-link>
          <div class="brand-emblem flex-shrink-0">V</div>
          <div class="d-flex flex-column">
            <div class="d-flex align-items-center gap-1 lh-1">
              <span class="fs-4 fw-black font-display text-dark tracking-tight">VOBO<span class="text-danger">KUN</span></span>
              <span class="badge bg-dark text-white rounded-1 px-1.5 py-0.5 small d-none d-sm-inline" style="font-size: 0.6rem; letter-spacing: 0.08em;">SHOWROOM</span>
            </div>
            <span class="text-muted fw-bold d-none d-sm-block" style="font-size: 0.65rem; letter-spacing: 0.1em; text-transform: uppercase;">Automobiles de Prestige</span>
          </div>
        </a>

        <!-- Mobile Toggler -->
        <button class="navbar-toggler border-0 p-1.5 shadow-none" type="button" id="mobile-menu-toggle-btn" aria-label="Toggle navigation">
          <i class="bi bi-list fs-2 text-dark" id="burger-icon"></i>
        </button>

        <!-- Navbar Content (Desktop) -->
        <div class="collapse navbar-collapse d-none d-lg-flex justify-content-end align-items-center" id="desktop-navbar-content">
          <div class="d-flex align-items-center gap-2">
            <a href="/" class="toyota-nav-link" data-link>Accueil</a>
            <a href="/catalogue" class="toyota-nav-link" data-link>
              <span>Catalogue Flotte</span>
              <span class="badge bg-danger rounded-pill px-2">8</span>
            </a>
            ${authLinksHTML}
          </div>
        </div>

      </div>

      <!-- Mobile Dropdown Menu -->
      <div class="d-lg-none w-100 bg-white border-top border-bottom mt-2 px-3 py-3 d-none shadow-lg animate-fade-in" id="mobile-menu">
        <div class="d-flex flex-column gap-1">
          <a href="/" class="toyota-nav-link justify-content-between py-2.5 px-3 rounded-3" data-link>
            <span class="d-flex align-items-center gap-2"><i class="bi bi-house-door text-danger"></i> Accueil</span>
            <i class="bi bi-chevron-right text-muted small"></i>
          </a>
          <a href="/catalogue" class="toyota-nav-link justify-content-between py-2.5 px-3 rounded-3" data-link>
            <span class="d-flex align-items-center gap-2"><i class="bi bi-grid-3x3-gap text-danger"></i> Catalogue SUV</span>
            <span class="badge bg-danger rounded-pill">8 véhicules</span>
          </a>
          ${user ? `
            ${user.role === 'admin' ? `
              <a href="/admin" class="toyota-nav-link justify-content-between py-2.5 px-3 rounded-3 text-danger fw-bold bg-danger-subtle" data-link>
                <span class="d-flex align-items-center gap-2"><i class="bi bi-speedometer2"></i> Console Concessionnaire</span>
                <span class="badge bg-danger">${unreadMessagesCount} msg</span>
              </a>
            ` : `
              <a href="/dashboard" class="toyota-nav-link justify-content-between py-2.5 px-3 rounded-3 fw-bold" data-link>
                <span class="d-flex align-items-center gap-2"><i class="bi bi-person-badge text-danger"></i> Mon Espace VIP</span>
                <span class="badge bg-danger">${unreadMessagesCount}</span>
              </a>
            `}
            <div class="pt-3 mt-2 border-top d-flex justify-content-between align-items-center">
              <a href="/dashboard?tab=profile" class="d-flex align-items-center gap-2 text-decoration-none text-dark" data-link>
                <img class="rounded-circle border border-danger" style="width: 34px; height: 34px; object-fit: cover;" src="${user.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}">
                <span class="fw-bold small">${user.prenom} ${user.nom}</span>
              </a>
              <button id="mobile-logout-btn" class="btn btn-sm btn-outline-danger fw-bold small">
                Déconnexion
              </button>
            </div>
          ` : `
            <div class="pt-3 mt-2 border-top">
              <a href="/login" class="btn-toyota-red w-100 justify-content-center py-2.5" data-link>
                <i class="bi bi-person-lock me-1"></i> Accéder à l'Espace Client
              </a>
            </div>
          `}
        </div>
      </div>

    </nav>
  `;
}

export function initNavbar() {
  const menuBtn = document.getElementById('mobile-menu-toggle-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const burgerIcon = document.getElementById('burger-icon');

  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const isClosed = mobileMenu.classList.contains('d-none');
      if (isClosed) {
        mobileMenu.classList.remove('d-none');
        burgerIcon.className = 'bi bi-x-lg fs-2 text-dark';
      } else {
        mobileMenu.classList.add('d-none');
        burgerIcon.className = 'bi bi-list fs-2 text-dark';
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
