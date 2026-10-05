import { signIn, signUp } from '../services/auth.js';
import { navigate } from '../router.js';
import { store } from '../store.js';

let currentTab = 'login'; // 'login' or 'register'

export function render() {
  return `
    <div class="flex items-center justify-center min-h-[70vh] animate-fade-in py-10">
      <div class="glass-panel border border-white/10 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-8 space-y-8 relative">
        
        <!-- Background glows -->
        <div class="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-suv-red/10 blur-[40px]"></div>
        <div class="absolute -left-20 -bottom-20 w-44 h-44 rounded-full bg-suv-purple/10 blur-[40px]"></div>
        
        <!-- Header logo -->
        <div class="text-center space-y-2 relative z-10">
          <div class="w-12 h-12 rounded-2xl bg-gradient-premium-red flex items-center justify-center font-black text-white text-xl shadow-xl shadow-suv-red/20 mx-auto">V</div>
          <h2 class="text-2xl font-black font-display tracking-tight text-white mt-4">Vobokun</h2>
          <p class="text-xs text-suv-gray">Accédez à votre espace concessionnaire digital</p>
        </div>

        <!-- Tab Switcher -->
        <div class="flex border-b border-white/10 relative z-10">
          <button id="tab-login-btn" class="flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${currentTab === 'login' ? 'border-suv-gold text-suv-gold' : 'border-transparent text-white/50 hover:text-white'}">
            Connexion
          </button>
          <button id="tab-register-btn" class="flex-1 pb-3 text-sm font-semibold transition-all border-b-2 ${currentTab === 'register' ? 'border-suv-gold text-suv-gold' : 'border-transparent text-white/50 hover:text-white'}">
            Créer un compte
          </button>
        </div>

        <!-- Error display -->
        <div id="auth-error-alert" class="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-3.5 rounded-xl font-medium hidden text-left leading-relaxed">
          <!-- Populated dynamically -->
        </div>

        <!-- LOGIN FORM -->
        <form id="login-form" class="space-y-5 text-left relative z-10 ${currentTab === 'login' ? '' : 'hidden'}">
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Adresse Email</label>
            <input type="email" id="login-email" placeholder="jean@vobokun.com (admin@vobokun.com)" class="w-full suv-input" required>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Mot de passe</label>
            <input type="password" id="login-password" placeholder="••••••••" class="w-full suv-input" required>
          </div>

          <button type="submit" class="w-full bg-gradient-premium-red hover:shadow-lg hover:shadow-suv-red/10 text-white py-3.5 rounded-xl font-bold transition-all duration-300">
            Se connecter
          </button>
        </form>

        <!-- REGISTER FORM -->
        <form id="register-form" class="space-y-4 text-left relative z-10 ${currentTab === 'register' ? '' : 'hidden'}">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Prénom</label>
              <input type="text" id="reg-prenom" placeholder="Jean" class="w-full suv-input text-sm" required>
            </div>
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Nom</label>
              <input type="text" id="reg-nom" placeholder="Dupont" class="w-full suv-input text-sm" required>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Téléphone</label>
            <input type="tel" id="reg-telephone" placeholder="+229 01 00 00 00 00" class="w-full suv-input text-sm" required>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Adresse Email</label>
            <input type="email" id="reg-email" placeholder="nom@exemple.com" class="w-full suv-input text-sm" required>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Mot de passe</label>
            <input type="password" id="reg-password" placeholder="••••••••" class="w-full suv-input text-sm" required minlength="6">
          </div>

          <button type="submit" class="w-full bg-gradient-premium-red hover:shadow-lg hover:shadow-suv-red/10 text-white py-3.5 rounded-xl font-bold transition-all duration-300">
            S'enregistrer
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

  // Toggle forms helper
  const switchTab = (tab) => {
    currentTab = tab;
    
    if (tab === 'login') {
      tabLoginBtn.classList.add('border-suv-gold', 'text-suv-gold');
      tabLoginBtn.classList.remove('border-transparent', 'text-white/50');
      tabRegisterBtn.classList.remove('border-suv-gold', 'text-suv-gold');
      tabRegisterBtn.classList.add('border-transparent', 'text-white/50');
      
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    } else {
      tabRegisterBtn.classList.add('border-suv-gold', 'text-suv-gold');
      tabRegisterBtn.classList.remove('border-transparent', 'text-white/50');
      tabLoginBtn.classList.remove('border-suv-gold', 'text-suv-gold');
      tabLoginBtn.classList.add('border-transparent', 'text-white/50');
      
      registerForm.classList.remove('hidden');
      loginForm.classList.add('hidden');
    }
    
    // Clear alerts
    if (errorAlert) {
      errorAlert.classList.add('hidden');
      errorAlert.textContent = '';
    }
  };

  // Bind tab toggles
  if (tabLoginBtn) tabLoginBtn.addEventListener('click', () => switchTab('login'));
  if (tabRegisterBtn) tabRegisterBtn.addEventListener('click', () => switchTab('register'));

  // Alert showing helper
  const showError = (message) => {
    if (errorAlert) {
      errorAlert.textContent = message;
      errorAlert.classList.remove('hidden');
    }
  };

  // Submit Sign In Form
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const email = document.getElementById('login-email').value.trim();
      const mdp = document.getElementById('login-password').value;

      try {
        const { user } = await signIn(email, mdp);
        // Successful login redirect
        navigate(user.role === 'admin' ? '/admin' : '/dashboard');
      } catch (err) {
        showError(err.message || 'Échec de la connexion. Veuillez vérifier vos identifiants.');
      }
    });
  }

  // Submit Sign Up Form
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
