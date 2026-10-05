import { signIn, signUp } from '../services/auth.js';
import { navigate } from '../router.js';
import { store } from '../store.js';

let currentTab = 'login';

export function render() {
  return `
    <div class="container py-5 my-4 d-flex justify-content-center align-items-center" style="min-height: 70vh;">
      <div class="toyota-panel rounded-4 shadow-lg p-4 p-sm-5 w-100 position-relative text-start" style="max-width: 480px;">
        
        <!-- Header Brand Monogram -->
        <div class="text-center mb-4">
          <div class="rounded-3 d-inline-flex align-items-center justify-content-center text-white fw-black fs-3 shadow-sm mb-2" style="width: 54px; height: 54px; background: var(--toyota-red);">V</div>
          <h3 class="fw-black font-display tracking-tight text-dark text-uppercase mb-1">Espace Membre Vobokun</h3>
          <p class="small text-muted mb-0">Accédez à votre compte VIP ou à la console showroom</p>
        </div>

        <!-- 1-Click Demo Profiles Ribbon -->
        <div class="p-3 rounded-3 mb-4 border" style="background: #F4F5F8;">
          <div class="text-uppercase fw-bold text-danger text-center mb-2" style="font-size: 0.7rem; letter-spacing: 0.05em;">Connexion Express Démo</div>
          <div class="row g-2">
            <div class="col-6">
              <button type="button" id="demo-user-btn" class="btn btn-toyota-outline btn-sm w-100 py-2 fw-bold" style="font-size: 0.75rem;">
                Compte Client VIP
              </button>
            </div>
            <div class="col-6">
              <button type="button" id="demo-admin-btn" class="btn btn-toyota-red btn-sm w-100 py-2 fw-bold" style="font-size: 0.75rem;">
                Console Showroom
              </button>
            </div>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="d-flex border-bottom mb-4">
          <button id="tab-login-btn" class="btn btn-link text-decoration-none flex-grow-1 pb-2 fw-black text-uppercase border-bottom border-3 ${currentTab === 'login' ? 'border-danger text-danger' : 'border-transparent text-secondary'}" style="font-size: 0.8rem; border-radius: 0;">
            Connexion
          </button>
          <button id="tab-register-btn" class="btn btn-link text-decoration-none flex-grow-1 pb-2 fw-black text-uppercase border-bottom border-3 ${currentTab === 'register' ? 'border-danger text-danger' : 'border-transparent text-secondary'}" style="font-size: 0.8rem; border-radius: 0;">
            Créer un compte
          </button>
        </div>

        <!-- Error Alert -->
        <div id="auth-error-alert" class="alert alert-danger py-2 px-3 small rounded-3 d-none mb-3 fw-semibold">
        </div>

        <!-- LOGIN FORM -->
        <form id="login-form" class="${currentTab === 'login' ? '' : 'd-none'}">
          <div class="mb-3">
            <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Adresse Email</label>
            <input type="email" id="login-email" placeholder="jean@vobokun.com" class="form-control toyota-input" required>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Mot de passe</label>
            <input type="password" id="login-password" placeholder="••••••••" class="form-control toyota-input" required>
          </div>

          <button type="submit" class="btn btn-toyota-red w-100 py-3 fw-black text-uppercase shadow-sm mt-3" style="font-size: 0.85rem;">
            Se Connecter
          </button>
        </form>

        <!-- REGISTER FORM -->
        <form id="register-form" class="${currentTab === 'register' ? '' : 'd-none'}">
          <div class="row g-2 mb-3">
            <div class="col-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Prénom</label>
              <input type="text" id="reg-prenom" placeholder="Jean" class="form-control toyota-input" required>
            </div>
            <div class="col-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Nom</label>
              <input type="text" id="reg-nom" placeholder="Dossou" class="form-control toyota-input" required>
            </div>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Téléphone WhatsApp</label>
            <input type="tel" id="reg-telephone" placeholder="+229 01 00 00 00 00" class="form-control toyota-input" required>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Adresse Email</label>
            <input type="email" id="reg-email" placeholder="nom@exemple.com" class="form-control toyota-input" required>
          </div>

          <div class="mb-3">
            <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Mot de passe</label>
            <input type="password" id="reg-password" placeholder="••••••••" class="form-control toyota-input" required minlength="6">
          </div>

          <button type="submit" class="btn btn-toyota-red w-100 py-3 fw-black text-uppercase shadow-sm mt-3" style="font-size: 0.85rem;">
            Créer Mon Compte VIP
          </button>
        </form>

      </div>
    </div>
  `;
}

export function init() {
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const tabLoginBtn = document.getElementById('tab-login-btn');
  const tabRegisterBtn = document.getElementById('tab-register-btn');
  const errorAlert = document.getElementById('auth-error-alert');
  const demoUserBtn = document.getElementById('demo-user-btn');
  const demoAdminBtn = document.getElementById('demo-admin-btn');

  const switchTab = (tab) => {
    currentTab = tab;
    
    if (tab === 'login') {
      tabLoginBtn.className = "btn btn-link text-decoration-none flex-grow-1 pb-2 fw-black text-uppercase border-bottom border-3 border-danger text-danger";
      tabRegisterBtn.className = "btn btn-link text-decoration-none flex-grow-1 pb-2 fw-black text-uppercase border-bottom border-3 border-transparent text-secondary";
      loginForm.classList.remove('d-none');
      registerForm.classList.add('d-none');
    } else {
      tabRegisterBtn.className = "btn btn-link text-decoration-none flex-grow-1 pb-2 fw-black text-uppercase border-bottom border-3 border-danger text-danger";
      tabLoginBtn.className = "btn btn-link text-decoration-none flex-grow-1 pb-2 fw-black text-uppercase border-bottom border-3 border-transparent text-secondary";
      registerForm.classList.remove('d-none');
      loginForm.classList.add('d-none');
    }
    
    if (errorAlert) {
      errorAlert.classList.add('d-none');
      errorAlert.textContent = '';
    }
  };

  if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchTab('login'));
  if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => switchTab('register'));

  const showError = (message) => {
    if (errorAlert) {
      errorAlert.textContent = message;
      errorAlert.classList.remove('d-none');
    }
  };

  // Demo profile shortcuts
  if (demoUserBtn) {
    demoUserBtn.addEventListener('click', async () => {
      document.getElementById('login-email').value = 'jean@vobokun.com';
      document.getElementById('login-password').value = 'demo1234';
      try {
        const { user } = await signIn('jean@vobokun.com', 'demo1234');
        navigate('/dashboard');
      } catch (e) {
        showError(e.message);
      }
    });
  }

  if (demoAdminBtn) {
    demoAdminBtn.addEventListener('click', async () => {
      document.getElementById('login-email').value = 'admin@vobokun.com';
      document.getElementById('login-password').value = 'admin1234';
      try {
        const { user } = await signIn('admin@vobokun.com', 'admin1234');
        navigate('/admin');
      } catch (e) {
        showError(e.message);
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value.trim();
      const mdp = document.getElementById('login-password').value;

      try {
        const { user } = await signIn(email, mdp);
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      } catch (err) {
        showError(err.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
      }
    });
  }

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const prenom = document.getElementById('reg-prenom').value.trim();
      const nom = document.getElementById('reg-nom').value.trim();
      const telephone = document.getElementById('reg-telephone').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;

      try {
        const { user } = await signUp(email, password, nom, prenom, telephone);
        navigate('/dashboard');
      } catch (err) {
        showError(err.message || 'Échec de la création du compte.');
      }
    });
  }
}
