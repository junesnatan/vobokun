import { signIn, signUp } from '../services/auth.js';
import { navigate } from '../router.js';
import { store } from '../store.js';

let currentTab = 'login';

export function render() {
  return `
    <div class="flex items-center justify-center min-h-[75vh] animate-fade-in py-12 px-4">
      <div class="glass-panel border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-8 sm:p-10 space-y-7 relative text-left">
        
        <!-- Ambient Champagne Backdrop -->
        <div class="absolute -right-20 -top-20 w-48 h-48 rounded-full bg-suv-gold/10 blur-[50px] pointer-events-none"></div>
        <div class="absolute -left-20 -bottom-20 w-48 h-48 rounded-full bg-sky-500/5 blur-[50px] pointer-events-none"></div>
        
        <!-- Header Brand Monogram -->
        <div class="text-center space-y-2 relative z-10">
          <div class="w-14 h-14 rounded-2xl bg-gradient-premium-gold flex items-center justify-center font-black text-black text-2xl shadow-xl shadow-suv-gold/25 mx-auto">V</div>
          <h2 class="text-2xl font-black font-display tracking-tight text-white mt-3 uppercase">Espace Membre Vobokun</h2>
          <p class="text-xs text-suv-gray">Accédez à votre compte ou découvrez nos services en direct</p>
        </div>

        <!-- 1-Click Demo Profiles Ribbon -->
        <div class="bg-white/5 border border-white/10 rounded-2xl p-3.5 space-y-2 relative z-10">
          <div class="text-[9px] font-black uppercase tracking-widest text-suv-gold text-center">Connexion Express Démo</div>
          <div class="grid grid-cols-2 gap-2">
            <button type="button" id="demo-user-btn" class="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[11px] font-bold transition-all text-center">
              Compte Client VIP
            </button>
            <button type="button" id="demo-admin-btn" class="py-2 px-3 rounded-xl bg-suv-gold/15 hover:bg-suv-gold/25 border border-suv-gold/30 text-suv-gold text-[11px] font-bold transition-all text-center">
              Console Concessionnaire
            </button>
          </div>
        </div>

        <!-- Tab Switcher -->
        <div class="flex border-b border-white/10 relative z-10">
          <button id="tab-login-btn" class="flex-1 pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${currentTab === 'login' ? 'border-suv-gold text-suv-gold' : 'border-transparent text-white/40 hover:text-white'}">
            Connexion
          </button>
          <button id="tab-register-btn" class="flex-1 pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${currentTab === 'register' ? 'border-suv-gold text-suv-gold' : 'border-transparent text-white/40 hover:text-white'}">
            Créer un compte
          </button>
        </div>

        <!-- Error Alert -->
        <div id="auth-error-alert" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3 rounded-xl font-semibold hidden leading-relaxed">
        </div>

        <!-- LOGIN FORM -->
        <form id="login-form" class="space-y-4 relative z-10 ${currentTab === 'login' ? '' : 'hidden'}">
          <div class="space-y-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Adresse Email</label>
            <input type="email" id="login-email" placeholder="jean@vobokun.com" class="w-full suv-input text-xs font-semibold" required>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Mot de passe</label>
            <input type="password" id="login-password" placeholder="••••••••" class="w-full suv-input text-xs font-semibold" required>
          </div>

          <button type="submit" class="w-full btn-premium-gold py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg mt-2">
            Se Connecter
          </button>
        </form>

        <!-- REGISTER FORM -->
        <form id="register-form" class="space-y-3.5 relative z-10 ${currentTab === 'register' ? '' : 'hidden'}">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Prénom</label>
              <input type="text" id="reg-prenom" placeholder="Jean" class="w-full suv-input text-xs font-semibold" required>
            </div>
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Nom</label>
              <input type="text" id="reg-nom" placeholder="Dossou" class="w-full suv-input text-xs font-semibold" required>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Téléphone WhatsApp</label>
            <input type="tel" id="reg-telephone" placeholder="+229 01 00 00 00 00" class="w-full suv-input text-xs font-semibold" required>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Adresse Email</label>
            <input type="email" id="reg-email" placeholder="nom@exemple.com" class="w-full suv-input text-xs font-semibold" required>
          </div>

          <div class="space-y-1.5">
            <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Mot de passe</label>
            <input type="password" id="reg-password" placeholder="••••••••" class="w-full suv-input text-xs font-semibold" required minlength="6">
          </div>

          <button type="submit" class="w-full btn-premium-gold py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 shadow-lg mt-2">
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
      tabLoginBtn.className = "flex-1 pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 border-suv-gold text-suv-gold";
      tabRegisterBtn.className = "flex-1 pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 border-transparent text-white/40 hover:text-white";
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    } else {
      tabRegisterBtn.className = "flex-1 pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 border-suv-gold text-suv-gold";
      tabLoginBtn.className = "flex-1 pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 border-transparent text-white/40 hover:text-white";
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    }
    
    if (errorAlert) {
      errorAlert.classList.add('hidden');
      errorAlert.textContent = '';
    }
  };

  if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchTab('login'));
  if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => switchTab('register'));

  const showError = (message) => {
    if (errorAlert) {
      errorAlert.textContent = message;
      errorAlert.classList.remove('hidden');
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
