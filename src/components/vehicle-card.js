import { toggleFavorite } from '../services/favorites.js';
import { store } from '../store.js';
import { navigate } from '../router.js';
import { isCompared, toggleCompare } from './comparison.js';

export function renderVehicleCard(vehicle, isFavorited = false) {
  const { id, marque, modele, annee, prix, kilometrage, carburant, transmission, photos, statut } = vehicle;
  const mainPhoto = photos && photos.length > 0 ? photos[0] : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75';

  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
  const formattedPrice = new Intl.NumberFormat('fr-FR').format(prix) + ' ' + currency;
  const formattedMileage = kilometrage ? new Intl.NumberFormat('fr-FR').format(kilometrage) + ' km' : 'Neuf / 0 km';
  
  // Calculate indicative monthly credit (48 months, 20% down, 5.9%)
  const financed = prix * 0.8;
  const r = 0.059 / 12;
  const approxMonthly = Math.round(financed * (r / (1 - Math.pow(1 + r, -48))));
  const formattedMonthly = new Intl.NumberFormat('fr-FR').format(approxMonthly);

  // Status Badge HTML
  let statusBadge = '';
  if (statut === 'disponible') {
    statusBadge = `<span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">Disponible</span>`;
  } else if (statut === 'vendu') {
    statusBadge = `<span class="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">Réservé</span>`;
  } else {
    statusBadge = `<span class="bg-white/10 text-white/50 border border-white/15 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm">Archivé</span>`;
  }

  const favoriteIconColor = isFavorited ? 'text-rose-500 fill-rose-500 scale-110' : 'text-white/70 hover:text-white group-hover:text-suv-gold';

  const compared = isCompared(id);
  const compareBtnClass = compared ? 'border-suv-gold bg-suv-gold/20 text-suv-gold' : 'border-white/10 text-white/60 hover:text-white hover:border-white/20';
  const compareBtnIcon = compared 
    ? `<svg class="w-4 h-4 text-suv-gold fill-current" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`
    : `<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>`;

  return `
    <div class="glass-card rounded-3xl overflow-hidden flex flex-col group h-full relative border border-white/10 hover:border-suv-gold/40 transition-all duration-300" 
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
      
      <!-- Visual Media Wrapper -->
      <div class="relative aspect-[16/10] overflow-hidden bg-[#11151C] cursor-pointer flex-shrink-0" data-detail-link>
        <img 
          src="${mainPhoto}" 
          alt="${marque} ${modele}" 
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" 
          loading="lazy"
          decoding="async"
        >
        
        <!-- Ambient Vignette Gradient -->
        <div class="absolute inset-0 bg-gradient-to-t from-[#0E1218] via-transparent to-black/30 opacity-80 group-hover:opacity-60 transition-opacity"></div>
        
        <!-- Top Left: Status Badge -->
        <div class="absolute top-4 left-4 z-10 flex items-center gap-2">
          ${statusBadge}
          <span class="bg-black/60 backdrop-blur-md border border-white/15 px-2.5 py-1 rounded-full text-[10px] font-black text-suv-gold uppercase tracking-wider">
            ${annee}
          </span>
        </div>
 
        <!-- Top Right: Favorite Button -->
        <div class="absolute top-4 right-4 z-10">
          <button class="favorite-toggle-btn w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center hover:bg-black/80 hover:border-suv-gold/50 transition-all" title="Favoris">
            <svg class="w-4 h-4 ${favoriteIconColor} transition-transform active:scale-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>
 
      <!-- Card Information -->
      <div class="p-6 flex-grow flex flex-col justify-between space-y-5 text-left">
        
        <div class="cursor-pointer space-y-3" data-detail-link>
          <!-- Brand and Model Title -->
          <div class="space-y-0.5">
            <div class="text-[11px] font-black text-suv-gold uppercase tracking-widest font-display">${marque}</div>
            <h3 class="text-lg font-black font-display text-white group-hover:text-suv-gold transition-colors tracking-tight leading-snug uppercase">
              ${modele}
            </h3>
          </div>
 
          <!-- Technical Specs Highlights -->
          <div class="grid grid-cols-3 gap-2 py-3 border-y border-white/5 text-[11px] font-semibold text-white/80">
            <div class="flex flex-col">
              <span class="text-white/40 text-[9px] uppercase tracking-wider font-bold">Kilomètres</span>
              <span class="font-sans font-bold text-white text-xs">${formattedMileage}</span>
            </div>
            <div class="flex flex-col border-x border-white/5 px-2">
              <span class="text-white/40 text-[9px] uppercase tracking-wider font-bold">Énergie</span>
              <span class="text-white truncate text-xs">${carburant}</span>
            </div>
            <div class="flex flex-col pl-1">
              <span class="text-white/40 text-[9px] uppercase tracking-wider font-bold">Boîte</span>
              <span class="text-white truncate text-xs">${transmission.split(' ')[0] || 'Auto'}</span>
            </div>
          </div>
        </div>
 
        <!-- Price & Action Footer -->
        <div class="flex items-end justify-between gap-3 pt-1">
          
          <div class="flex flex-col">
            <span class="text-[9px] text-white/40 uppercase tracking-widest font-bold">Prix Showroom</span>
            <span class="text-lg sm:text-xl font-black font-display text-suv-gold text-glow-gold tracking-tight">${formattedPrice}</span>
            <span class="text-[10px] text-white/40">dès ${formattedMonthly} F/mois</span>
          </div>
 
          <div class="flex items-center gap-2">
            <button class="btn-compare-toggle p-2.5 rounded-xl border ${compareBtnClass} bg-white/5 hover:bg-white/10 transition-all" data-vehicle-id="${id}" title="Comparer">
              ${compareBtnIcon}
            </button>
            <a href="/vehicle/${id}" class="btn-premium-gold p-2.5 rounded-xl flex items-center justify-center transition-all shadow-md group-hover:scale-105" data-link title="Voir la fiche">
              <svg class="w-4 h-4 text-black font-bold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
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

  containerElement.querySelectorAll('[data-detail-link]').forEach(elem => {
    elem.addEventListener('click', (e) => {
      const card = e.target.closest('[data-vehicle-id]');
      if (card) {
        const id = card.getAttribute('data-vehicle-id');
        navigate(`/vehicle/${id}`);
      }
    });
  });

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
          svg.setAttribute('class', 'w-4 h-4 text-rose-500 fill-rose-500 scale-110 transition-all');
        } else {
          svg.setAttribute('class', 'w-4 h-4 text-white/70 hover:text-white transition-all');
        }
      } catch (err) {
        console.error('Failed to toggle favorite', err);
      } finally {
        btn.disabled = false;
      }
    });
  });

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
