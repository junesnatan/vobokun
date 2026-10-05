import { getVehicleById, incrementViews, getSimilarVehicles } from '../services/vehicles.js';
import { isFavorite, toggleFavorite } from '../services/favorites.js';
import { createOffer } from '../services/requests.js';
import { renderVehicleCard, initVehicleCards } from '../components/vehicle-card.js';
import { updateChatVehicleContext } from '../components/chat.js';
import { store } from '../store.js';
import { navigate } from '../router.js';

let activeVehicle = null;

export function render(params) {
  return `
    <div class="animate-fade-in space-y-12 text-left" id="vehicle-details-root">
      <div class="text-center py-24 text-suv-gray font-medium">Chargement instantané du véhicule...</div>
    </div>

    <!-- NEGOTIATION OFFER MODAL -->
    <div id="offer-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md hidden animate-fade-in">
      <div class="glass-panel border border-white/15 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-slide-up text-left">
        
        <!-- Header -->
        <div class="bg-gradient-premium-gold p-6 flex justify-between items-center text-black">
          <div>
            <span class="text-[10px] font-black uppercase tracking-widest text-black/70">Négociation Directe</span>
            <h3 class="font-black text-xl font-display">Faire une Offre de Prix</h3>
            <p class="text-xs text-black/80 font-bold mt-0.5" id="modal-vehicle-title">Modèle</p>
          </div>
          <button id="close-offer-modal-btn" class="p-1.5 hover:bg-black/10 rounded-xl transition-colors">
            <svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Form -->
        <form id="offer-form" class="p-6 sm:p-8 space-y-5">
          <div class="bg-white/5 border border-white/10 p-4 rounded-2xl text-xs flex justify-between items-center">
            <span class="text-white/60 font-semibold uppercase tracking-wider">Prix Catalogue :</span>
            <span class="text-suv-gold font-black text-base font-sans" id="modal-catalog-price">0 FCFA</span>
          </div>

          <!-- Price Bid -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold flex items-center justify-between">
              <span>Votre offre de prix (FCFA)</span>
              <span class="text-white/40 lowercase font-normal">(optionnel)</span>
            </label>
            <input type="number" id="offer-price-input" placeholder="Ex: 40000000" class="w-full suv-input text-sm font-semibold">
          </div>

          <!-- Message -->
          <div class="space-y-2">
            <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Message pour le concessionnaire</label>
            <textarea id="offer-message-input" rows="4" placeholder="Ex: Bonjour, je suis intéressé par ce véhicule. Je propose ce montant et je suis prêt à concrétiser..." class="w-full suv-input text-xs leading-relaxed" required></textarea>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 pt-2">
            <button type="button" id="cancel-offer-btn" class="flex-1 border border-white/10 hover:bg-white/5 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all">
              Annuler
            </button>
            <button type="submit" class="flex-1 btn-premium-gold py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg">
              Envoyer l'Offre
            </button>
          </div>
        </form>

      </div>
    </div>

    <!-- Image Lightbox container -->
    <div id="lightbox-container" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl hidden animate-fade-in">
      <button id="close-lightbox-btn" class="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl transition-all">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      <img id="lightbox-img" src="" alt="Zoom" class="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl">
    </div>
  `;
}

export async function init(params) {
  const root = document.getElementById('vehicle-details-root');
  if (!root) return;

  const vehicleId = params.id;

  try {
    const { data: vehicle, error } = await getVehicleById(vehicleId);
    if (error || !vehicle) throw new Error("Véhicule introuvable");

    activeVehicle = vehicle;
    
    // Increment views in background
    incrementViews(vehicleId);

    // Initial instant render with empty similar list (0ms latency)
    const isFav = await isFavorite(vehicleId);
    renderDetailsDOM(root, vehicle, isFav, []);
    initDetailsListeners(vehicle);

    // Load similar vehicles asynchronously in background without blocking
    getSimilarVehicles(vehicle).then(({ data: similar }) => {
      const simContainer = document.getElementById('similar-grid');
      if (simContainer && similar && similar.length > 0) {
        simContainer.innerHTML = similar.map(v => renderVehicleCard(v)).join('');
        initVehicleCards(simContainer);
      }
    }).catch(console.error);

  } catch (err) {
    console.error('Failed to init vehicle page:', err);
    root.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4">
        <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-suv-gold mx-auto">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        </div>
        <h2 class="text-2xl font-black text-white font-display uppercase tracking-tight">Véhicule Introuvable</h2>
        <p class="text-xs text-suv-gray max-w-sm">Le SUV recherché a été déplacé ou n'est plus disponible dans notre showroom.</p>
        <a href="/catalogue" class="btn-premium-gold px-7 py-3 rounded-xl text-xs font-black uppercase tracking-wider mt-4" data-link>Retour au catalogue</a>
      </div>
    `;
  }
}

function renderDetailsDOM(root, vehicle, isFav, similar) {
  const { id, marque, modele, annee, prix, kilometrage, carburant, transmission, description, photos, statut } = vehicle;

  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
  const formattedPrice = new Intl.NumberFormat('fr-FR').format(prix) + ' ' + currency;
  const formattedMileage = kilometrage ? new Intl.NumberFormat('fr-FR').format(kilometrage) + ' km' : 'Neuf / 0 km';
  const mainPhoto = photos && photos.length > 0 ? photos[0] : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75';

  // Monthly estimate (48 months, 20% down, 5.9%)
  const financed = prix * 0.8;
  const r = 0.059 / 12;
  const approxMonthly = Math.round(financed * (r / (1 - Math.pow(1 + r, -48))));
  const formattedMonthly = new Intl.NumberFormat('fr-FR').format(approxMonthly);

  // Thumbnails HTML
  let thumbnailsHTML = '';
  if (photos && photos.length > 0) {
    thumbnailsHTML = photos.map((photo, idx) => `
      <button class="aspect-[16/10] rounded-2xl overflow-hidden border-2 ${idx === 0 ? 'border-suv-gold ring-2 ring-suv-gold/30' : 'border-transparent'} bg-white/5 thumbnail-btn focus:outline-none transition-all duration-200 hover:scale-105">
        <img src="${photo}" alt="Miniature ${idx + 1}" class="w-full h-full object-cover">
      </button>
    `).join('');
  }

  const favBtnIcon = isFav ? 'text-rose-500 fill-rose-500' : 'text-white/60 hover:text-white';

  root.innerHTML = `
    <!-- Top Breadcrumb & Status -->
    <div class="flex items-center justify-between border-b border-white/10 pb-4">
      <a href="/catalogue" class="text-xs text-suv-gold hover:text-suv-gold-light font-bold uppercase tracking-wider flex items-center gap-1.5 group" data-link>
        <svg class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        <span>Retour au Showroom</span>
      </a>
      <div class="flex items-center gap-3">
        <span class="text-xs text-white/50 font-mono">REF: ${id.substring(0, 10).toUpperCase()}</span>
        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${statut === 'disponible' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}">
          <span class="w-1.5 h-1.5 rounded-full ${statut === 'disponible' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}"></span>
          ${statut === 'disponible' ? 'Disponible en Showroom' : 'Réservé'}
        </span>
      </div>
    </div>

    <!-- Main Grid: Gallery & Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
      
      <!-- LEFT: Photo Gallery (lg: 7 cols) -->
      <div class="lg:col-span-7 space-y-5">
        
        <!-- Big Photo Viewport -->
        <div class="relative aspect-[16/10] rounded-3xl overflow-hidden bg-[#11151C] border border-white/10 group cursor-zoom-in shadow-2xl" id="primary-photo-view">
          <img src="${mainPhoto}" id="primary-photo-img" alt="${marque} ${modele}" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80"></div>
          
          <div class="absolute bottom-5 right-5 bg-black/60 backdrop-blur-md text-white text-xs px-3.5 py-2 rounded-xl flex items-center gap-2 border border-white/15 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-4 h-4 text-suv-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            <span class="font-bold">Agrandir la vue</span>
          </div>

          <div class="absolute top-5 left-5 bg-black/60 backdrop-blur-md border border-white/15 px-3 py-1.5 rounded-xl text-xs font-black text-suv-gold uppercase tracking-wider">
            ${annee} &middot; Certifié Vobokun
          </div>
        </div>

        <!-- Thumbnails Row -->
        <div class="grid grid-cols-5 gap-3">
          ${thumbnailsHTML}
        </div>

        <!-- Technical Bento Grid -->
        <div class="space-y-4 pt-4">
          <h3 class="text-xs font-black uppercase tracking-widest text-suv-gold font-display">Spécifications Techniques</h3>
          
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div class="spec-grid-item">
              <span class="text-[9px] uppercase tracking-wider text-white/40 font-bold block">Motorisation</span>
              <p class="text-xs font-black text-white mt-1 truncate" title="${vehicle.motorisation || 'N/A'}">${vehicle.motorisation || 'N/A'}</p>
            </div>
            <div class="spec-grid-item">
              <span class="text-[9px] uppercase tracking-wider text-white/40 font-bold block">Puissance</span>
              <p class="text-xs font-black text-suv-gold mt-1">${vehicle.puissance || 'N/A'}</p>
            </div>
            <div class="spec-grid-item">
              <span class="text-[9px] uppercase tracking-wider text-white/40 font-bold block">0 &rarr; 100 km/h</span>
              <p class="text-xs font-black text-white mt-1">${vehicle.acceleration || 'N/A'}</p>
            </div>
            <div class="spec-grid-item">
              <span class="text-[9px] uppercase tracking-wider text-white/40 font-bold block">Consommation</span>
              <p class="text-xs font-black text-white mt-1">${vehicle.consommation || 'N/A'}</p>
            </div>
            <div class="spec-grid-item">
              <span class="text-[9px] uppercase tracking-wider text-white/40 font-bold block">Places assises</span>
              <p class="text-xs font-black text-white mt-1">${vehicle.places ? vehicle.places + ' places' : '5 places'}</p>
            </div>
            <div class="spec-grid-item">
              <span class="text-[9px] uppercase tracking-wider text-white/40 font-bold block">Volume Coffre</span>
              <p class="text-xs font-black text-white mt-1">${vehicle.coffre || 'N/A'}</p>
            </div>
          </div>
        </div>

        <!-- Description Box -->
        <div class="glass-card p-6 rounded-3xl space-y-3">
          <h3 class="text-xs font-black uppercase tracking-widest text-suv-gold font-display">Historique & Équipements</h3>
          <p class="text-xs sm:text-sm text-white/80 leading-relaxed font-normal whitespace-pre-line">
            ${description || "Véhicule d'exception certifié par nos experts. Carnet d'entretien officiel à jour et double des clés disponibles."}
          </p>
        </div>

      </div>

      <!-- RIGHT: Vehicle Purchase & Actions (lg: 5 cols) -->
      <div class="lg:col-span-5 space-y-6">
        
        <!-- Header Card -->
        <div class="glass-panel border border-white/10 p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl">
          
          <div class="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <span class="text-xs font-black uppercase tracking-widest text-suv-gold">${marque}</span>
              <h1 class="text-2xl sm:text-3xl font-black text-white font-display uppercase tracking-tight mt-0.5">${modele}</h1>
              <div class="flex items-center gap-2 mt-2 text-xs text-white/60 font-semibold">
                <span>${formattedMileage}</span>
                <span>&middot;</span>
                <span>${carburant}</span>
                <span>&middot;</span>
                <span>${transmission}</span>
              </div>
            </div>

            <button id="details-fav-btn" class="p-3 rounded-2xl bg-white/5 border border-white/10 hover:border-suv-gold/40 transition-colors" title="Favoris">
              <svg class="w-5 h-5 ${favBtnIcon} transition-transform active:scale-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </button>
          </div>

          <!-- Price & Financial Tag -->
          <div class="space-y-1">
            <span class="text-[10px] font-black uppercase tracking-widest text-white/40">Tarif Showroom Garanti</span>
            <div class="text-3xl sm:text-4xl font-black font-display text-suv-gold text-glow-gold tracking-tight">
              ${formattedPrice}
            </div>
            <div class="text-xs text-white/50">
              Soit environ <strong class="text-white">${formattedMonthly} FCFA</strong>/mois en crédit bancaire
            </div>
          </div>

          <!-- Direct Purchase Triggers -->
          ${statut === 'disponible' ? `
            <div class="space-y-3 pt-2">
              <button id="open-offer-modal-btn" class="w-full btn-premium-gold py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 shadow-xl">
                <svg class="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                <span>Faire une offre de prix</span>
              </button>
              
              <button id="direct-chat-trigger-btn" class="w-full btn-premium-dark py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                <svg class="w-4 h-4 text-suv-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                <span>Négocier par messagerie en direct</span>
              </button>

              <a id="whatsapp-contact-btn" target="_blank" rel="noopener noreferrer" class="w-full bg-[#25D366]/20 border border-[#25D366]/40 hover:bg-[#25D366]/30 text-[#25D366] py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.774 9.774 0 00-6.96-2.85c-5.438 0-9.863 4.37-9.866 9.801-.001 1.816.488 3.59 1.417 5.16l-.999 3.648 3.734-.972zm12.113-6.52c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/></svg>
                <span>Contacter le Showroom WhatsApp</span>
              </a>
            </div>
          ` : `
            <div class="bg-rose-500/10 text-rose-400 border border-rose-500/25 p-4 rounded-2xl text-center font-bold text-xs">
              Ce véhicule n'est plus disponible à la vente actuellement.
            </div>
          `}

          <!-- Assurance Reassurance List -->
          <div class="pt-4 border-t border-white/10 space-y-2.5 text-xs text-white/70">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>Contrôle technique 150 points certifié</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>Garantie 12 mois pièces & main d'œuvre</span>
            </div>
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
              <span>Possibilité d'essai sans engagement</span>
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- SIMILAR VEHICLES SECTION -->
    <section class="space-y-6 pt-10 border-t border-white/10 text-left">
      <div class="space-y-1">
        <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Showroom Suggestion</span>
        <h2 class="text-2xl font-black text-white uppercase tracking-tight">Véhicules Similaires</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="similar-grid">
        <div class="col-span-full text-center py-8 text-white/40 text-xs">Recherche des modèles comparables...</div>
      </div>
    </section>
  `;

  updateChatVehicleContext(vehicle);
}

function initDetailsListeners(vehicle) {
  const pPhoto = document.getElementById('primary-photo-view');
  const pPhotoImg = document.getElementById('primary-photo-img');
  const favBtn = document.getElementById('details-fav-btn');
  const modal = document.getElementById('offer-modal');
  const openModalBtn = document.getElementById('open-offer-modal-btn');
  const closeModalBtn = document.getElementById('close-offer-modal-btn');
  const cancelBtn = document.getElementById('cancel-offer-btn');
  const offerForm = document.getElementById('offer-form');
  const chatBtn = document.getElementById('direct-chat-trigger-btn');
  const whatsappBtn = document.getElementById('whatsapp-contact-btn');
  
  if (whatsappBtn) {
    const siteTel = localStorage.getItem('suv_site_tel') || '+229 01 00 00 00 00';
    let cleanTel = siteTel.replace(/\D/g, '');
    if (cleanTel.startsWith('00229')) cleanTel = cleanTel.substring(2);
    if (!cleanTel.startsWith('229')) cleanTel = '229' + cleanTel;
    
    const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
    const formattedPrice = new Intl.NumberFormat('fr-FR').format(vehicle.prix) + ' ' + currency;
    const encodedMsg = encodeURIComponent(`Bonjour Atelier Vobokun, je suis intéressé par le SUV ${vehicle.marque} ${vehicle.modele} (${vehicle.annee}) affiché à ${formattedPrice}. Est-il disponible pour un essai ?`);
    whatsappBtn.setAttribute('href', `https://wa.me/${cleanTel}?text=${encodedMsg}`);
  }

  const lightbox = document.getElementById('lightbox-container');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeLightboxBtn = document.getElementById('close-lightbox-btn');

  // Miniatures gallery switcher
  document.querySelectorAll('.thumbnail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.thumbnail-btn').forEach(b => {
        b.classList.remove('border-suv-gold', 'ring-2', 'ring-suv-gold/30');
        b.classList.add('border-transparent');
      });
      btn.classList.add('border-suv-gold', 'ring-2', 'ring-suv-gold/30');
      btn.classList.remove('border-transparent');
      
      const newSrc = btn.querySelector('img').getAttribute('src');
      if (pPhotoImg) pPhotoImg.setAttribute('src', newSrc);
    });
  });

  if (pPhoto && pPhotoImg && lightbox && lightboxImg) {
    pPhoto.addEventListener('click', () => {
      lightboxImg.setAttribute('src', pPhotoImg.getAttribute('src'));
      lightbox.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeLightboxBtn && lightbox) {
    closeLightboxBtn.addEventListener('click', () => {
      lightbox.classList.add('hidden');
      document.body.style.overflow = '';
    });
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.add('hidden');
        document.body.style.overflow = '';
      }
    });
  }

  if (favBtn) {
    favBtn.addEventListener('click', async () => {
      const user = store.getState().user;
      if (!user) {
        navigate('/login');
        return;
      }

      favBtn.disabled = true;
      try {
        const isFavNow = await toggleFavorite(vehicle.id);
        const svg = favBtn.querySelector('svg');
        if (isFavNow) {
          svg.setAttribute('class', 'w-5 h-5 text-rose-500 fill-rose-500 scale-110 transition-transform');
        } else {
          svg.setAttribute('class', 'w-5 h-5 text-white/60 hover:text-white transition-transform');
        }
      } catch (err) {
        console.error('Favorite click error:', err);
      } finally {
        favBtn.disabled = false;
      }
    });
  }

  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', () => {
      const user = store.getState().user;
      if (!user) {
        navigate('/login');
        return;
      }
      document.getElementById('modal-vehicle-title').textContent = `${vehicle.marque} ${vehicle.modele} (${vehicle.annee})`;
      const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
      document.getElementById('modal-catalog-price').textContent = new Intl.NumberFormat('fr-FR').format(vehicle.prix) + ' ' + currency;
      
      modal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  }

  const hideModal = () => {
    if (modal) modal.classList.add('hidden');
    if (offerForm) offerForm.reset();
    document.body.style.overflow = '';
  };

  if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
  if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

  if (offerForm) {
    offerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bidInput = document.getElementById('offer-price-input');
      const msgInput = document.getElementById('offer-message-input');

      const bid = bidInput.value ? parseFloat(bidInput.value) : null;
      const msg = msgInput.value.trim();

      try {
        await createOffer(vehicle.id, msg, bid);
        alert('Votre offre a été soumise avec succès au showroom Vobokun ! Vous recevrez une réponse sous 24h.');
        hideModal();
      } catch (err) {
        console.error('Error submitting offer:', err);
        alert('Échec de la soumission de l\'offre : ' + err.message);
      }
    });
  }

  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      const user = store.getState().user;
      if (!user) {
        navigate('/login');
        return;
      }
      
      updateChatVehicleContext(vehicle);
      const bubble = document.getElementById('chat-toggle-bubble');
      if (bubble) bubble.click();
    });
  }
}
