import { toggleFavorite } from '../services/favorites.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { isCompared, toggleCompare } from './comparison.js';

export function renderVehicleCard(vehicle, isFavorited = false) {
  const { id, marque, modele, annee, prix, kilometrage, carburant, transmission, photos, statut } = vehicle;
  const mainPhoto = photos && photos.length > 0 ? photos[0] : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80';

  // Format price based on settings
  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
  const formattedPrice = new Intl.NumberFormat('fr-FR').format(prix) + ' ' + currency;
  const formattedMileage = kilometrage ? new Intl.NumberFormat('fr-FR').format(kilometrage) + ' km' : 'N/A';

  // Status Badge HTML
  let statusBadge = '';
  if (statut === 'disponible') {
    statusBadge = `<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Disponible</span>`;
  } else if (statut === 'vendu') {
    statusBadge = `<span class="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Vendu</span>`;
  } else {
    statusBadge = `<span class="bg-white/10 text-white/50 border border-white/10 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">Archivé</span>`;
  }

  // Favorite button styling
  const favoriteIconColor = isFavorited ? 'text-suv-red fill-suv-red scale-110' : 'text-white/60 hover:text-white group-hover:text-suv-gold';

  const compared = isCompared(id);
  const compareBtnClass = compared ? 'border-suv-gold/30 text-suv-gold' : 'border-white/10 text-white/60';
  const compareBtnIcon = compared 
    ? `<svg class="w-4.5 h-4.5 text-suv-gold fill-current" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`
    : `<svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>`;

  return `
    <div class="glass-card rounded-3xl overflow-hidden flex flex-col group h-full relative" 
      data-vehicle-id="${id}"
      data-marque="${marque}"
      data-modele="${modele}"
      data-annee="${annee}"
      data-prix="${prix}"
      data-kilometrage="${kilometrage || 0}"
      data-carburant="${carburant}"
      data-transmission="${transmission}"
      data-photo="${mainPhoto}"
      data-statut="${statut}">
      
      <!-- Image Wrapper with luxury gradients -->
      <div class="relative aspect-[16/10] overflow-hidden bg-[#161219] cursor-pointer flex-shrink-0" data-detail-link>
        <img src="${mainPhoto}" alt="${marque} ${modele}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy">
        
        <!-- Dark ambient overlay gradient -->
        <div class="absolute inset-0 bg-gradient-to-t from-[#0b090c] via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity duration-300"></div>
        
        <!-- Top Overlay: Status Badge -->
        <div class="absolute top-4 left-4 z-10">
          ${statusBadge}
        </div>
 
        <!-- Right Top Overlay: Year Badge -->
        <div class="absolute top-4 right-4 z-10 bg-black/40 backdrop-blur-md border border-white/10 px-2.5 py-1 rounded-lg text-xxs font-extrabold text-suv-gold">
          ${annee}
        </div>
      </div>
 
      <!-- Card Core Information -->
      <div class="p-6 flex-grow flex flex-col justify-between space-y-6">
        
        <div class="cursor-pointer space-y-4" data-detail-link>
          <!-- Brand and Model Title -->
          <div class="space-y-1">
            <h3 class="text-xl font-black font-display text-white group-hover:text-suv-gold transition-colors duration-300 tracking-tight leading-tight uppercase">
              ${marque}
            </h3>
            <p class="text-xs text-white/50 font-medium tracking-wide uppercase">
              ${modele}
            </p>
          </div>
 
          <!-- Specs row with thin grid divider -->
          <div class="grid grid-cols-3 gap-2 border-y border-white/5 py-3 text-xxs font-bold text-white/70 uppercase tracking-wider">
            <div class="flex flex-col items-start space-y-1">
              <span class="text-white/30 font-medium lowercase text-[10px]">kilométrage</span>
              <span class="text-white font-sans">${formattedMileage}</span>
            </div>
            <div class="flex flex-col items-start space-y-1 border-x border-white/5 px-2">
              <span class="text-white/30 font-medium lowercase text-[10px]">énergie</span>
              <span class="text-white">${carburant}</span>
            </div>
            <div class="flex flex-col items-start space-y-1 pl-1">
              <span class="text-white/30 font-medium lowercase text-[10px]">transmission</span>
              <span class="text-white">${transmission}</span>
            </div>
          </div>
        </div>
 
        <!-- Price block & Actions -->
        <div class="flex items-center justify-between gap-4 pt-2">
          
          <!-- Price Badge -->
          <div class="flex flex-col">
            <span class="text-[9px] text-white/40 uppercase tracking-widest font-bold">Prix Privilège</span>
            <span class="text-lg md:text-xl font-extrabold font-display text-suv-gold text-glow-gold tracking-tight">${formattedPrice}</span>
          </div>
 
          <!-- Actions -->
          <div class="flex items-center gap-1.5">
            <button class="btn-compare-toggle p-2.5 rounded-xl bg-white/5 border ${compareBtnClass} hover:bg-white/10 hover:border-white/15 transition-all duration-300" data-vehicle-id="${id}" title="Comparer ce véhicule">
              ${compareBtnIcon}
            </button>
            <button class="favorite-toggle-btn p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/15 transition-all duration-300" title="Ajouter aux favoris">
              <svg class="w-4.5 h-4.5 ${favoriteIconColor} transition-all duration-300 transform active:scale-95" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
            <a href="/vehicle/${id}" class="btn-premium-red text-white p-2.5 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95" data-link title="Détails du véhicule">
              <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </a>
          </div>
 
        </div>
 
      </div>
    </div>
  `;
}

export function initVehicleCards(containerElement) {
  if (!containerElement) return;

  // Set detail links navigation
  containerElement.querySelectorAll('[data-detail-link]').forEach(elem => {
    elem.addEventListener('click', (e) => {
      const card = e.target.closest('[data-vehicle-id]');
      if (card) {
        const id = card.getAttribute('data-vehicle-id');
        navigate(`/vehicle/${id}`);
      }
    });
  });

  // Set favorites toggling
  containerElement.querySelectorAll('.favorite-toggle-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const card = btn.closest('[data-vehicle-id]');
      if (!card) return;

      const id = card.getAttribute('data-vehicle-id');
      const user = store.getState().user;

      if (!user) {
        navigate('/login');
        return;
      }

      btn.disabled = true;
      try {
        const isFavNow = await toggleFavorite(id);
        const svg = btn.querySelector('svg');
        if (isFavNow) {
          svg.className.value = "w-5 h-5 text-suv-red fill-suv-red scale-110 transition-all duration-300";
          btn.setAttribute('title', 'Retirer des favoris');
        } else {
          svg.className.value = "w-5 h-5 text-white/60 hover:text-white transition-all duration-300";
          btn.setAttribute('title', 'Ajouter aux favoris');
        }
      } catch (err) {
        console.error('Failed to toggle favorite', err);
      } finally {
        btn.disabled = false;
      }
    });
  });

  // Set comparison toggling
  containerElement.querySelectorAll('.btn-compare-toggle').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('[data-vehicle-id]');
      if (!card) return;

      const id = card.getAttribute('data-vehicle-id');
      const vehicle = {
        id,
        marque: card.getAttribute('data-marque'),
        modele: card.getAttribute('data-modele'),
        annee: card.getAttribute('data-annee'),
        prix: parseFloat(card.getAttribute('data-prix')),
        kilometrage: parseInt(card.getAttribute('data-kilometrage') || '0'),
        carburant: card.getAttribute('data-carburant'),
        transmission: card.getAttribute('data-transmission'),
        photos: [card.getAttribute('data-photo')],
        statut: card.getAttribute('data-statut')
      };

      toggleCompare(vehicle);
    });
  });
}
