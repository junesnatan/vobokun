import { getVehicles } from './vehicles.js';
import { navigate } from '../router.js';

const CITIES = [
  "Cotonou", "Porto-Novo", "Parakou", "Abomey-Calavi", 
  "Ouidah", "Bohicon", "Dassa-Zoumé", "Natitingou", "Kandi"
];

const NAMES = [
  "M. Koffi", "Mme Gnonnan", "M. Dossou", "Mme Bio", 
  "M. Soglo", "Mme Agbossou", "M. Kerekou", "Mme Gbaguidi", 
  "M. Adjovi", "Mme Fagnon", "M. Houngbo", "Mme Zinsou",
  "M. Tossou", "Mme Codjia", "M. Béhanzin"
];

const ACTIONS = [
  "vient de planifier un essai sur le",
  "consulte la fiche technique du",
  "a soumis une offre d'achat pour le",
  "a ajouté à ses favoris le",
  "se renseigne sur les options de financement pour le",
  "vient de demander la disponibilité du"
];

let socialProofTimeout = null;

export function initSocialProof() {
  if (socialProofTimeout) return; // Prevent duplicate initialization

  // Schedule first notification after 15 seconds
  scheduleNextNotification(15000);
}

function scheduleNextNotification(delay = null) {
  const nextDelay = delay !== null ? delay : (Math.random() * (35000 - 20000) + 20000); // Between 20s and 35s
  
  socialProofTimeout = setTimeout(async () => {
    try {
      await showRandomNotification();
    } catch (e) {
      console.error("Error showing social proof toast:", e);
    }
    scheduleNextNotification();
  }, nextDelay);
}

async function showRandomNotification() {
  const { data: vehicles } = await getVehicles({ statut: 'disponible' });
  if (!vehicles || vehicles.length === 0) return;

  // Select random vehicle, city, name, action
  const vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
  const city = CITIES[Math.floor(Math.random() * CITIES.length)];
  const name = NAMES[Math.floor(Math.random() * NAMES.length)];
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];

  // Create toast container in body if not exists
  let container = document.getElementById('social-proof-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'social-proof-container';
    container.className = 'fixed bottom-6 left-6 z-50 flex flex-col gap-3 pointer-events-none w-full max-w-sm';
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.className = 'glass-panel pointer-events-auto flex items-center gap-3 p-3 rounded-xl border shadow-2xl cursor-pointer hover:border-suv-gold/50 transition-all duration-500 transform translate-x-[-120%] opacity-0 w-[320px] md:w-[350px] relative overflow-hidden';
  toast.style.borderColor = 'rgba(255, 255, 255, 0.08)';

  toast.innerHTML = `
    <!-- Vehicle Thumbnail -->
    <img src="${vehicle.photos?.[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=150&q=80'}" class="w-12 h-12 rounded-lg object-cover border border-white/10 flex-shrink-0" />
    
    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p class="text-xs text-white/60 font-semibold mb-0.5">${name} de <span class="text-suv-gold" style="color: var(--color-suv-gold);">${city}</span></p>
      <p class="text-[11px] text-white/90 font-medium leading-tight">${action} <span class="text-suv-gold font-bold" style="color: var(--color-suv-gold);">${vehicle.marque} ${vehicle.modele}</span></p>
      <p class="text-[9px] text-white/40 mt-1 font-sans flex items-center gap-1">
        <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        À l'instant
      </p>
    </div>
    
    <!-- Close Button -->
    <button class="absolute top-2 right-2 text-white/30 hover:text-white/80 p-0.5" data-close-toast>
      <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
    </button>
    
    <!-- Premium gold accent line at the bottom -->
    <div class="absolute bottom-0 left-0 right-0 h-0.5" style="background-color: var(--color-suv-gold);"></div>
  `;

  // Navigate when clicking on toast (except close button)
  toast.addEventListener('click', (e) => {
    if (e.target.closest('[data-close-toast]')) return;
    navigate('/vehicle/' + vehicle.id);
    dismissToast(toast);
  });

  // Dismiss toast when clicking close
  const closeBtn = toast.querySelector('[data-close-toast]');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dismissToast(toast);
  });

  // Add to container
  container.appendChild(toast);

  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-[-120%]', 'opacity-0');
    toast.classList.add('translate-x-0', 'opacity-100');
  }, 100);

  // Auto-dismiss after 8 seconds
  const autoDismissTimer = setTimeout(() => {
    dismissToast(toast);
  }, 8000);

  // Store auto-dismiss timer on the element to clear if manually dismissed
  toast.dataset.timerId = autoDismissTimer;
}

function dismissToast(toast) {
  if (toast.dataset.timerId) {
    clearTimeout(parseInt(toast.dataset.timerId, 10));
  }
  
  toast.classList.remove('translate-x-0', 'opacity-100');
  toast.classList.add('translate-x-[-120%]', 'opacity-0');
  
  // Remove from DOM after transition
  setTimeout(() => {
    toast.remove();
  }, 500);
}
