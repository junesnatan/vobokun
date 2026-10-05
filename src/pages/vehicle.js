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
    <div class="animate-fade-in space-y-12" id="vehicle-details-root">
      <div class="text-center py-20 text-suv-gray">Chargement du véhicule...</div>
    </div>

    <!-- NEGOTIATION OFFER MODAL -->
    <div id="offer-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm hidden animate-fade-in">
      <div class="glass-panel border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-slide-up">
        
        <!-- Header -->
        <div class="bg-gradient-premium-red p-5 flex justify-between items-center text-white">
          <div>
            <h3 class="font-extrabold text-lg font-display">Faire une Offre de Prix</h3>
            <p class="text-xs text-white/70" id="modal-vehicle-title">Modèle</p>
          </div>
          <button id="close-offer-modal-btn" class="p-1 hover:bg-white/10 rounded-lg transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Form -->
        <form id="offer-form" class="p-6 space-y-6 text-left">
          <div class="space-y-1 bg-white/5 border border-white/5 p-4 rounded-xl text-sm flex justify-between">
            <span class="text-white/60">Prix catalogue :</span>
            <span class="text-suv-gold font-bold" id="modal-catalog-price">0 FCFA</span>
          </div>

          <!-- Price Bid (Optional) -->
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-wider text-suv-gray flex items-center justify-between">
              <span>Votre offre (FCFA)</span>
              <span class="text-xxs text-white/30 lowercase font-normal">(optionnel)</span>
            </label>
            <input type="number" id="offer-price-input" placeholder="Ex: 40000000" class="w-full suv-input focus:border-suv-gold">
          </div>

          <!-- Message -->
          <div class="space-y-2">
            <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Message pour le concessionnaire</label>
            <textarea id="offer-message-input" rows="4" placeholder="Ex: Bonjour, je souhaite faire une offre pour ce véhicule. Je suis disponible pour le régler..." class="w-full suv-input focus:border-suv-gold" required></textarea>
          </div>

          <!-- Actions -->
          <div class="flex gap-4 pt-2">
            <button type="button" id="cancel-offer-btn" class="flex-1 border border-white/10 hover:bg-white/5 text-white py-3 rounded-xl font-bold transition-all">
              Annuler
            </button>
            <button type="submit" class="flex-1 bg-suv-red hover:bg-suv-purple text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-suv-red/10">
              Soumettre
            </button>
          </div>
        </form>

      </div>
    </div>

    <!-- Image Lightbox container -->
    <div id="lightbox-container" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 hidden animate-fade-in">
      <button id="close-lightbox-btn" class="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all">
        <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
      </button>
      <img id="lightbox-img" src="" alt="Lightbox image" class="max-w-full max-h-[85vh] object-contain rounded-lg">
    </div>
  `;
}

export async function init(params) {
  const root = document.getElementById('vehicle-details-root');
  if (!root) return;

  const vehicleId = params.id;

  try {
    // 1. Fetch Vehicle detail & similar items
    const { data: vehicle, error } = await getVehicleById(vehicleId);
    if (error || !vehicle) throw new Error("Véhicule introuvable");

    activeVehicle = vehicle;
    
    // 2. Increment views (async background)
    incrementViews(vehicleId);

    // 3. Fetch similar products
    const { data: similar } = await getSimilarVehicles(vehicle);

    // 4. Check if currently favorited
    const isFav = await isFavorite(vehicleId);

    // Render specs and page DOM
    renderDetailsDOM(root, vehicle, isFav, similar);
    
    // Attach details page event handlers
    initDetailsListeners(vehicle);

  } catch (err) {
    console.error('Failed to init vehicle page:', err);
    root.innerHTML = `
      <div class="flex flex-col items-center justify-center min-h-[40vh] text-center">
        <h2 class="text-xl font-bold text-white">Véhicule introuvable</h2>
        <p class="text-suv-gray mt-2">Le véhicule que vous recherchez n'est pas ou plus répertorié.</p>
        <a href="/catalogue" class="mt-6 bg-suv-red text-white px-6 py-2.5 rounded-lg font-bold" data-link>Retour au catalogue</a>
      </div>
    `;
  }
}

function renderDetailsDOM(root, vehicle, isFav, similar) {
  const { id, marque, modele, annee, prix, kilometrage, carburant, transmission, couleur, description, photos, statut } = vehicle;

  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
  const formattedPrice = new Intl.NumberFormat('fr-FR').format(prix) + ' ' + currency;
  const formattedMileage = kilometrage ? new Intl.NumberFormat('fr-FR').format(kilometrage) + ' km' : 'N/A';
  const mainPhoto = photos && photos.length > 0 ? photos[0] : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80';

  // Miniatures HTML
  let thumbnailsHTML = '';
  if (photos && photos.length > 0) {
    thumbnailsHTML = photos.map((photo, idx) => `
      <button class="aspect-[16/10] rounded-xl overflow-hidden border-2 ${idx === 0 ? 'border-suv-gold' : 'border-transparent'} bg-white/5 thumbnail-btn focus:outline-none transition-all duration-200">
        <img src="${photo}" alt="Miniature ${idx + 1}" class="w-full h-full object-cover">
      </button>
    `).join('');
  }

  // Similar vehicles cards
  const similarHTML = similar && similar.length > 0
    ? similar.map(v => renderVehicleCard(v)).join('')
    : '<p class="text-sm text-suv-gray col-span-full text-center">Aucun véhicule similaire disponible actuellement.</p>';

  // Favorite button classes
  const favBtnText = isFav ? 'Retirer des favoris' : 'Ajouter aux favoris';
  const favBtnIcon = isFav ? 'text-suv-red fill-suv-red' : 'text-white/70';

  root.innerHTML = `
    <!-- Top breadcrumb bar -->
    <div class="flex items-center justify-between border-b border-white/5 pb-4">
      <a href="/catalogue" class="text-xs text-suv-gold hover:text-suv-yellow font-bold uppercase tracking-wider flex items-center gap-1 group" data-link>
        <svg class="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Retour au showroom
      </a>
      <span class="text-xs text-suv-gray">Référence : ${id.substring(0, 8).toUpperCase()}</span>
    </div>

    <!-- Main Grid Section -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      
      <!-- LEFT: Photo gallery panel (lg: 7 cols) -->
      <div class="lg:col-span-7 space-y-6">
        <!-- Big photo viewport -->
        <div class="relative aspect-[16/10] rounded-3xl overflow-hidden bg-white/5 border border-white/10 group cursor-zoom-in" id="primary-photo-view">
          <img src="${mainPhoto}" id="primary-photo-img" alt="${marque} ${modele}" class="w-full h-full object-cover">
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          
          <!-- Zoom indicator bubble -->
          <div class="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md text-white/90 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            Agrandir
          </div>
        </div>

        <!-- Thumbnails carousel row -->
        <div class="grid grid-cols-5 gap-4">
          ${thumbnailsHTML}
        </div>
      </div>

      <!-- RIGHT: Vehicle info Panel (lg: 5 cols) -->
      <div class="lg:col-span-5 space-y-8">
        
        <!-- Header, Brand, Model & Favorite -->
        <div class="space-y-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h1 class="text-3xl md:text-4xl font-extrabold text-white font-display">${marque}</h1>
              <p class="text-lg text-suv-gold font-medium mt-1">${modele}</p>
            </div>
            
            <button id="details-fav-btn" class="p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors flex items-center justify-center" title="${favBtnText}">
              <svg class="w-6 h-6 ${favBtnIcon} transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/>
              </svg>
            </button>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <span class="bg-suv-gold text-suv-red text-xs px-3 py-1 rounded-full font-bold uppercase">${annee}</span>
            <span class="bg-white/5 border border-white/10 text-white/80 text-xs px-3 py-1 rounded-full">${carburant}</span>
            <span class="bg-white/5 border border-white/10 text-white/80 text-xs px-3 py-1 rounded-full">${transmission}</span>
          </div>
        </div>

        <!-- Price display and buying triggers -->
        <div class="glass-panel border border-white/10 p-6 rounded-2xl space-y-6">
          <div class="space-y-1">
            <p class="text-xs font-bold uppercase tracking-wider text-suv-gray">Prix de vente</p>
            <p class="text-3xl md:text-4xl font-black font-display text-suv-gold">${formattedPrice}</p>
          </div>
          
          ${statut === 'disponible' ? `
            <div class="grid grid-cols-1 gap-3">
              <button id="open-offer-modal-btn" class="w-full bg-gradient-premium-red hover:shadow-lg hover:shadow-suv-red/25 text-white py-3.5 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-0.5">
                Faire une offre de prix
              </button>
              <a id="whatsapp-contact-btn" target="_blank" rel="noopener noreferrer" class="w-full bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-600/25 text-white py-3.5 rounded-xl font-bold transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2">
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.799.002-2.63-1.023-5.101-2.885-6.966a9.774 9.774 0 00-6.96-2.85c-5.438 0-9.863 4.37-9.866 9.801-.001 1.816.488 3.59 1.417 5.16l-.999 3.648 3.734-.972zm12.113-6.52c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z"/></svg>
                Discuter sur WhatsApp
              </a>
              <button id="direct-chat-trigger-btn" class="w-full border border-white/10 hover:border-white hover:bg-white/5 text-white py-3.5 rounded-xl font-bold transition-all duration-300">
                Discuter en ligne
              </button>
            </div>
          ` : `
            <div class="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-4 py-3 rounded-xl text-center font-bold text-sm">
              Ce véhicule a été vendu ou n'est plus disponible à la vente.
            </div>
          `}
        </div>

        <!-- Specifications attributes -->
        <div class="space-y-4">
          <h3 class="text-xs font-bold uppercase tracking-widest text-suv-gray font-display">Fiche Technique</h3>
          
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            
            <div class="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-suv-gray font-bold">Motorisation</span>
              <p class="text-sm font-bold text-white truncate" title="${vehicle.motorisation || 'N/A'}">${vehicle.motorisation || 'N/A'}</p>
            </div>

            <div class="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-suv-gray font-bold">Année</span>
              <p class="text-sm font-bold text-suv-gold">${annee}</p>
            </div>

            <div class="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-suv-gray font-bold">Puissance</span>
              <p class="text-sm font-bold text-white">${vehicle.puissance || 'N/A'}</p>
            </div>

            <div class="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-suv-gray font-bold">0 → 100 km/h</span>
              <p class="text-sm font-bold text-white">${vehicle.acceleration || 'N/A'}</p>
            </div>

            <div class="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-suv-gray font-bold">Transmission</span>
              <p class="text-sm font-bold text-white truncate" title="${transmission || 'N/A'}">${transmission || 'N/A'}</p>
            </div>

            <div class="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-suv-gray font-bold">Consommation</span>
              <p class="text-sm font-bold text-white">${vehicle.consommation || 'N/A'}</p>
            </div>

            <div class="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-suv-gray font-bold">Nombre de places</span>
              <p class="text-sm font-bold text-white">${vehicle.places ? vehicle.places + ' places' : 'N/A'}</p>
            </div>

            <div class="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-suv-gray font-bold">Capacité Coffre</span>
              <p class="text-sm font-bold text-white">${vehicle.coffre || 'N/A'}</p>
            </div>

            <div class="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-suv-gray font-bold">Couleurs dispo</span>
              <p class="text-sm font-bold text-white truncate" title="${vehicle.couleurs_dispo || 'N/A'}">${vehicle.couleurs_dispo || 'N/A'}</p>
            </div>

            <div class="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-suv-gray font-bold">Kilométrage</span>
              <p class="text-sm font-bold text-white">${formattedMileage}</p>
            </div>

            <div class="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-suv-gray font-bold">Vues catalogue</span>
              <p class="text-sm font-bold text-white">${vehicle.vues || 0} vues</p>
            </div>

            <div class="bg-white/5 border border-white/5 p-4 rounded-xl text-left space-y-1">
              <span class="text-[10px] uppercase tracking-wider text-suv-gray font-bold">Disponibilité</span>
              <p class="text-sm font-bold text-emerald-400 capitalize">${statut === 'disponible' ? 'Disponible' : 'Vendu'}</p>
            </div>

          </div>
        </div>

        <!-- Description body -->
        <div class="space-y-3 text-left">
          <h3 class="text-xs font-bold uppercase tracking-widest text-suv-gray">Description</h3>
          <p class="text-sm text-white/80 leading-relaxed font-light whitespace-pre-line">
            ${description || "Aucune description fournie par le concessionnaire pour ce véhicule."}
          </p>
        </div>

      </div>
    </div>

    <!-- Similar vehicles segment -->
    <section class="space-y-8 pt-12 border-t border-white/5 text-left">
      <div>
        <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Suggestions</span>
        <h2 class="text-2xl font-extrabold text-white mt-1">Véhicules Similaires</h2>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="similar-grid">
        ${similarHTML}
      </div>
    </section>

  `;

  // Set context on the global chat
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
  
  // Set WhatsApp dynamic link
  if (whatsappBtn) {
    const siteTel = localStorage.getItem('suv_site_tel') || '+229 01 00 00 00 00';
    
    // Robust WhatsApp phone formatting
    let cleanTel = siteTel.replace(/\D/g, '');
    if (cleanTel.startsWith('00229')) {
      cleanTel = cleanTel.substring(2);
    }
    if (!cleanTel.startsWith('229')) {
      cleanTel = '229' + cleanTel;
    }
    
    const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
    const formattedPrice = new Intl.NumberFormat('fr-FR').format(vehicle.prix) + ' ' + currency;
    const encodedMsg = encodeURIComponent(`Bonjour, je suis intéressé par le véhicule ${vehicle.marque} ${vehicle.modele} (${vehicle.annee}) affiché à ${formattedPrice}. Est-il toujours disponible ?`);
    whatsappBtn.setAttribute('href', `https://wa.me/${cleanTel}?text=${encodedMsg}`);
  }

  // Lightbox selectors
  const lightbox = document.getElementById('lightbox-container');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeLightboxBtn = document.getElementById('close-lightbox-btn');

  // Miniatures gallery switcher
  document.querySelectorAll('.thumbnail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove border highlight from all thumbnails
      document.querySelectorAll('.thumbnail-btn').forEach(b => b.classList.replace('border-suv-gold', 'border-transparent'));
      btn.classList.replace('border-transparent', 'border-suv-gold');
      
      const newSrc = btn.querySelector('img').getAttribute('src');
      if (pPhotoImg) pPhotoImg.setAttribute('src', newSrc);
    });
  });

  // Lightbox click on big photo
  if (pPhoto && pPhotoImg && lightbox && lightboxImg) {
    pPhoto.addEventListener('click', () => {
      lightboxImg.setAttribute('src', pPhotoImg.getAttribute('src'));
      lightbox.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    });
  }

  // Close Lightbox
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

  // Favorite toggle click
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
          svg.classList.add('text-suv-red', 'fill-suv-red');
          svg.classList.remove('text-white/70');
          favBtn.setAttribute('title', 'Retirer des favoris');
        } else {
          svg.classList.remove('text-suv-red', 'fill-suv-red');
          svg.classList.add('text-white/70');
          favBtn.setAttribute('title', 'Ajouter aux favoris');
        }
      } catch (err) {
        console.error('Favorite click error:', err);
      } finally {
        favBtn.disabled = false;
      }
    });
  }

  // Offer Modal actions
  if (openModalBtn && modal) {
    openModalBtn.addEventListener('click', () => {
      const user = store.getState().user;
      if (!user) {
        navigate('/login');
        return;
      }
      // Populate labels
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

  // Submit Offer
  if (offerForm) {
    offerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const bidInput = document.getElementById('offer-price-input');
      const msgInput = document.getElementById('offer-message-input');

      const bid = bidInput.value ? parseFloat(bidInput.value) : null;
      const msg = msgInput.value.trim();

      try {
        await createOffer(vehicle.id, msg, bid);
        alert('Votre offre a été soumise avec succès ! Le concessionnaire l\'étudiera dans les plus brefs délais.');
        hideModal();
      } catch (err) {
        console.error('Error submitting offer:', err);
        alert('Échec de la soumission de l\'offre : ' + err.message);
      }
    });
  }

  // Trigger floating chat when clicking "Discuter en ligne"
  if (chatBtn) {
    chatBtn.addEventListener('click', () => {
      const user = store.getState().user;
      if (!user) {
        navigate('/login');
        return;
      }
      
      // Update vehicle context on the global chat just in case
      updateChatVehicleContext(vehicle);
      
      // Click the floating bubble programmatically
      const bubble = document.getElementById('chat-toggle-bubble');
      if (bubble) bubble.click();
    });
  }

  // Bind similar vehicles cards click
  const similarGrid = document.getElementById('similar-grid');
  if (similarGrid) {
    initVehicleCards(similarGrid);
  }
}
