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
    <div class="container py-4 pb-sticky-mobile text-start" id="vehicle-details-root">
      <div class="text-center py-5 text-muted">
        <div class="spinner-border text-danger mb-3" role="status"></div>
        <p class="fw-semibold">Chargement instantané du véhicule...</p>
      </div>
    </div>

    <!-- NEGOTIATION OFFER MODAL -->
    <div id="offer-modal" class="position-fixed top-0 start-0 w-100 h-100 d-none align-items-center justify-content-center p-3" style="background: rgba(10, 10, 10, 0.85); backdrop-filter: blur(8px); z-index: 1055;">
      <div class="toyota-panel rounded-4 w-100 shadow-2xl p-0 overflow-hidden text-start" style="max-width: 520px;">
        
        <!-- Header -->
        <div class="p-4 d-flex justify-content-between align-items-center text-white" style="background: var(--toyota-red);">
          <div>
            <span class="badge bg-black text-white text-uppercase tracking-wider mb-1" style="font-size: 0.65rem;">Négociation Directe</span>
            <h4 class="fw-black mb-0 font-display">Faire une Offre de Prix</h4>
            <p class="small text-white-50 mb-0 mt-1 fw-bold" id="modal-vehicle-title">Modèle</p>
          </div>
          <button id="close-offer-modal-btn" class="btn btn-sm btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;" aria-label="Fermer">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Form -->
        <form id="offer-form" class="p-4">
          <div class="p-3 rounded-3 mb-3 d-flex justify-content-between align-items-center border" style="background: #F4F5F8;">
            <span class="text-muted fw-bold small text-uppercase">Prix Catalogue :</span>
            <span class="fw-black fs-5 text-danger font-display" id="modal-catalog-price">0 FCFA</span>
          </div>

          <!-- Price Bid -->
          <div class="mb-3">
            <label class="form-label small fw-bold text-uppercase d-flex justify-content-between" style="font-size: 0.75rem;">
              <span>Votre offre de prix (FCFA)</span>
              <span class="text-muted text-lowercase fw-normal">(optionnel)</span>
            </label>
            <input type="number" id="offer-price-input" placeholder="Ex: 40000000" class="form-control toyota-input fw-semibold">
          </div>

          <!-- Message -->
          <div class="mb-4">
            <label class="form-label small fw-bold text-uppercase" style="font-size: 0.75rem;">Message pour le showroom</label>
            <textarea id="offer-message-input" rows="4" placeholder="Ex: Bonjour, je suis intéressé par ce SUV d'exception. Je propose ce montant pour concrétisation rapide..." class="form-control toyota-input" required></textarea>
          </div>

          <!-- Actions -->
          <div class="d-flex gap-2">
            <button type="button" id="cancel-offer-btn" class="btn btn-toyota-outline flex-grow-1 py-2 fw-bold text-uppercase" style="font-size: 0.8rem;">
              Annuler
            </button>
            <button type="submit" class="btn btn-toyota-red flex-grow-1 py-2 fw-black text-uppercase shadow-sm" style="font-size: 0.8rem;">
              Envoyer l'Offre
            </button>
          </div>
        </form>

      </div>
    </div>

    <!-- Image Lightbox container -->
    <div id="lightbox-container" class="position-fixed top-0 start-0 w-100 h-100 d-none align-items-center justify-content-center p-3" style="background: rgba(0, 0, 0, 0.95); z-index: 1060;">
      <button id="close-lightbox-btn" class="btn btn-dark rounded-circle position-absolute top-0 end-0 m-4 p-2 text-white border-white" style="width: 44px; height: 44px;">
        <i class="bi bi-x-lg fs-5"></i>
      </button>
      <img id="lightbox-img" src="" alt="Zoom" class="img-fluid rounded-3 shadow-lg" style="max-height: 88vh; object-fit: contain;">
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

    // Initial instant render
    const isFav = await isFavorite(vehicleId);
    renderDetailsDOM(root, vehicle, isFav, []);
    initDetailsListeners(vehicle);

    // Load similar vehicles asynchronously in background without blocking
    getSimilarVehicles(vehicle).then(({ data: similar }) => {
      const simContainer = document.getElementById('similar-grid');
      if (simContainer && similar && similar.length > 0) {
        simContainer.innerHTML = similar.map(v => `
          <div class="col-12 col-md-6 col-lg-3">
            ${renderVehicleCard(v)}
          </div>
        `).join('');
        initVehicleCards(simContainer);
      }
    }).catch(console.error);

  } catch (err) {
    console.error('Failed to init vehicle page:', err);
    root.innerHTML = `
      <div class="d-flex flex-col align-items-center justify-content-center text-center py-5">
        <div class="rounded-circle bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mb-3" style="width: 64px; height: 64px;">
          <i class="bi bi-exclamation-triangle fs-2"></i>
        </div>
        <h2 class="fw-black text-uppercase font-display">Véhicule Introuvable</h2>
        <p class="text-muted small max-w-sm mb-4">Le SUV recherché a été déplacé ou n'est plus disponible dans notre showroom.</p>
        <a href="/catalogue" class="btn btn-toyota-red px-4 py-2 text-uppercase fw-bold" data-link>Retour au catalogue</a>
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
      <div class="flex-shrink-0" style="width: 78px; scroll-snap-align: start;">
        <button class="thumbnail-btn w-100 rounded-3 overflow-hidden border p-0 ${idx === 0 ? 'border-danger ring-2' : 'border-secondary-subtle'}" style="aspect-ratio: 16/10; background: #eee;">
          <img src="${photo}" alt="Miniature ${idx + 1}" class="w-100 h-100 object-fit-cover">
        </button>
      </div>
    `).join('');
  }

  const isFavClass = isFav ? 'bi-heart-fill text-danger' : 'bi-heart text-muted';

  root.innerHTML = `
    <!-- Top Breadcrumb & Status -->
    <div class="d-flex flex-wrap align-items-center justify-content-between pb-3 mb-4 border-bottom gap-2">
      <a href="/catalogue" class="text-decoration-none fw-bold small text-danger d-inline-flex align-items-center gap-2" data-link>
        <i class="bi bi-arrow-left"></i>
        <span>Retour au Showroom</span>
      </a>
      <div class="d-flex align-items-center gap-2">
        <span class="badge bg-light text-secondary border font-monospace py-2 px-3">REF: ${id.substring(0, 10).toUpperCase()}</span>
        <span class="badge ${statut === 'disponible' ? 'bg-success-subtle text-success border border-success-subtle' : 'bg-danger-subtle text-danger border border-danger-subtle'} rounded-pill px-3 py-2 fw-bold">
          <i class="bi ${statut === 'disponible' ? 'bi-check-circle-fill' : 'bi-dash-circle-fill'} me-1"></i>
          ${statut === 'disponible' ? 'Disponible en Showroom' : 'Réservé'}
        </span>
      </div>
    </div>

    <!-- Main Grid: Gallery & Specs / Sidebar Actions -->
    <div class="row g-4 align-items-start">
      
      <!-- LEFT: Photo Gallery (col-lg-7) -->
      <div class="col-lg-7">
        
        <!-- Big Photo Viewport -->
        <div class="position-relative rounded-4 overflow-hidden border shadow-sm cursor-zoom-in" id="primary-photo-view" style="aspect-ratio: 16/10; background: #0A0A0A; cursor: pointer;">
          <img src="${mainPhoto}" id="primary-photo-img" alt="${marque} ${modele}" class="w-100 h-100 object-fit-cover">
          
          <div class="position-absolute top-0 start-0 m-3">
            <span class="badge bg-black text-white text-uppercase tracking-wider px-3 py-2 border border-secondary shadow-sm" style="font-size: 0.7rem;">
              ${annee} &middot; Certifié Vobokun
            </span>
          </div>

          <div class="position-absolute bottom-0 end-0 m-3">
            <span class="badge bg-dark bg-opacity-75 text-white px-3 py-2 rounded-3 border border-white-50 shadow-sm d-inline-flex align-items-center gap-1">
              <i class="bi bi-zoom-in text-danger"></i>
              <span class="small fw-bold">Agrandir la vue</span>
            </span>
          </div>
        </div>

        <!-- Thumbnails Row (Horizontal touch-scroll track) -->
        <div class="d-flex gap-2 mt-2 overflow-x-auto no-scrollbar py-1 brand-scroll-track" style="scroll-snap-type: x mandatory;">
          ${thumbnailsHTML}
        </div>

        <!-- Technical Specs Bento -->
        <div class="mt-4 pt-2">
          <h5 class="fw-black text-uppercase font-display mb-3" style="letter-spacing: 0.05em; font-size: 0.9rem;">
            <i class="bi bi-speedometer2 text-danger me-2"></i>Spécifications Techniques
          </h5>
          
          <div class="row row-cols-2 row-cols-sm-3 g-2">
            <div class="col">
              <div class="toyota-spec-box h-100">
                <span class="toyota-spec-label">Motorisation</span>
                <span class="toyota-spec-val text-truncate" title="${vehicle.motorisation || 'N/A'}">${vehicle.motorisation || 'N/A'}</span>
              </div>
            </div>
            <div class="col">
              <div class="toyota-spec-box h-100">
                <span class="toyota-spec-label">Puissance</span>
                <span class="toyota-spec-val text-danger">${vehicle.puissance || 'N/A'}</span>
              </div>
            </div>
            <div class="col">
              <div class="toyota-spec-box h-100">
                <span class="toyota-spec-label">0 &rarr; 100 km/h</span>
                <span class="toyota-spec-val">${vehicle.acceleration || 'N/A'}</span>
              </div>
            </div>
            <div class="col">
              <div class="toyota-spec-box h-100">
                <span class="toyota-spec-label">Consommation</span>
                <span class="toyota-spec-val">${vehicle.consommation || 'N/A'}</span>
              </div>
            </div>
            <div class="col">
              <div class="toyota-spec-box h-100">
                <span class="toyota-spec-label">Places assises</span>
                <span class="toyota-spec-val">${vehicle.places ? vehicle.places + ' places' : '5 places'}</span>
              </div>
            </div>
            <div class="col">
              <div class="toyota-spec-box h-100">
                <span class="toyota-spec-label">Volume Coffre</span>
                <span class="toyota-spec-val">${vehicle.coffre || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Description Box -->
        <div class="toyota-panel rounded-4 p-4 mt-4">
          <h5 class="fw-black text-uppercase font-display mb-2" style="font-size: 0.9rem;">
            <i class="bi bi-shield-check text-danger me-2"></i>Historique & Équipements
          </h5>
          <p class="text-secondary small mb-0 lh-lg" style="white-space: pre-line;">
            ${description || "Véhicule d'exception certifié par nos experts. Carnet d'entretien officiel à jour et double des clés disponibles."}
          </p>
        </div>

      </div>

      <!-- RIGHT: Vehicle Purchase & Actions (col-lg-5) -->
      <div class="col-lg-5">
        
        <div class="toyota-panel rounded-4 p-4 shadow-sm border position-sticky" style="top: 90px;">
          
          <div class="d-flex justify-content-between align-items-start pb-3 border-bottom">
            <div>
              <span class="badge bg-danger-subtle text-danger fw-bold text-uppercase mb-1" style="font-size: 0.7rem;">${marque}</span>
              <h1 class="h3 fw-black text-dark font-display mb-1 text-uppercase">${modele}</h1>
              <div class="d-flex flex-wrap align-items-center gap-2 small text-muted">
                <span>${formattedMileage}</span>
                <span>&bull;</span>
                <span>${carburant}</span>
                <span>&bull;</span>
                <span>${transmission}</span>
              </div>
            </div>

            <button id="details-fav-btn" class="btn btn-outline-secondary rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 44px; height: 44px;" title="Favoris">
              <i class="bi ${isFavClass} fs-5"></i>
            </button>
          </div>

          <!-- Price & Financial Tag -->
          <div class="py-3 my-1">
            <span class="small fw-bold text-muted text-uppercase d-block" style="font-size: 0.7rem;">Tarif Showroom Garanti</span>
            <div class="h2 fw-black text-danger font-display mb-1">
              ${formattedPrice}
            </div>
            <div class="small text-muted">
              Soit environ <strong class="text-dark">${formattedMonthly} FCFA</strong>/mois en crédit bancaire
            </div>
          </div>

          <!-- Direct Purchase Triggers -->
          ${statut === 'disponible' ? `
            <div class="d-grid gap-2 pt-2">
              <button id="open-offer-modal-btn" class="btn btn-toyota-red py-3 fw-black text-uppercase d-flex align-items-center justify-content-center gap-2 shadow-sm" style="font-size: 0.85rem;">
                <i class="bi bi-tag-fill"></i>
                <span>Faire une offre de prix</span>
              </button>
              
              <button id="direct-chat-trigger-btn" class="btn btn-toyota-dark py-3 fw-bold text-uppercase d-flex align-items-center justify-content-center gap-2" style="font-size: 0.85rem;">
                <i class="bi bi-chat-dots-fill text-danger"></i>
                <span>Négocier par messagerie en direct</span>
              </button>

              <a id="whatsapp-contact-btn" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success py-3 fw-bold text-uppercase d-flex align-items-center justify-content-center gap-2" style="font-size: 0.85rem;">
                <i class="bi bi-whatsapp"></i>
                <span>Contacter le Showroom WhatsApp</span>
              </a>
            </div>
          ` : `
            <div class="alert alert-danger py-3 text-center fw-bold small rounded-3 mt-2 mb-0">
              <i class="bi bi-dash-circle me-1"></i> Ce véhicule n'est plus disponible à la vente actuellement.
            </div>
          `}

          <!-- Assurance Reassurance List -->
          <div class="pt-4 mt-3 border-top small text-secondary">
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="bi bi-check-circle-fill text-danger fs-6"></i>
              <span>Contrôle technique 150 points certifié</span>
            </div>
            <div class="d-flex align-items-center gap-2 mb-2">
              <i class="bi bi-check-circle-fill text-danger fs-6"></i>
              <span>Garantie 12 mois pièces & main d'œuvre</span>
            </div>
            <div class="d-flex align-items-center gap-2">
              <i class="bi bi-check-circle-fill text-danger fs-6"></i>
              <span>Possibilité d'essai sans engagement</span>
            </div>
          </div>

        </div>

      </div>

    </div>

    <!-- SIMILAR VEHICLES SECTION -->
    <section class="mt-5 pt-4 border-top">
      <div class="mb-4">
        <span class="badge bg-danger text-white text-uppercase tracking-wider mb-1" style="font-size: 0.7rem;">Showroom Suggestion</span>
        <h3 class="fw-black text-uppercase font-display mb-0">Véhicules Similaires</h3>
      </div>

      <div class="row g-4" id="similar-grid">
        <div class="col-12 text-center py-4 text-muted small">Recherche des modèles comparables...</div>
      </div>
    </section>

    <!-- MOBILE STICKY BOTTOM BAR -->
    ${statut === 'disponible' ? `
      <div class="mobile-sticky-cta d-lg-none d-flex align-items-center justify-content-between gap-3 px-3 py-2 border-top shadow-lg">
        <div class="min-w-0">
          <span class="d-block text-muted text-uppercase fw-bold" style="font-size: 0.65rem;">Prix Showroom</span>
          <span class="fw-black text-danger font-display fs-6 text-truncate d-block">${formattedPrice}</span>
        </div>
        <div class="d-flex align-items-center gap-2 flex-shrink-0">
          <a id="mobile-sticky-whatsapp-btn" target="_blank" rel="noopener noreferrer" class="btn btn-outline-success btn-sm px-3 py-2 d-flex align-items-center justify-content-center" title="WhatsApp">
            <i class="bi bi-whatsapp fs-6"></i>
          </a>
          <button id="mobile-sticky-offer-btn" class="btn btn-toyota-red btn-sm fw-black text-uppercase px-3 py-2 shadow-sm" style="font-size: 0.75rem;">
            Faire une offre
          </button>
        </div>
      </div>
    ` : ''}
  `;

  updateChatVehicleContext(vehicle);
}

function initDetailsListeners(vehicle) {
  const pPhoto = document.getElementById('primary-photo-view');
  const pPhotoImg = document.getElementById('primary-photo-img');
  const favBtn = document.getElementById('details-fav-btn');
  const modal = document.getElementById('offer-modal');
  const openModalBtn = document.getElementById('open-offer-modal-btn');
  const mobileOfferBtn = document.getElementById('mobile-sticky-offer-btn');
  const closeModalBtn = document.getElementById('close-offer-modal-btn');
  const cancelBtn = document.getElementById('cancel-offer-btn');
  const offerForm = document.getElementById('offer-form');
  const chatBtn = document.getElementById('direct-chat-trigger-btn');
  const whatsappBtn = document.getElementById('whatsapp-contact-btn');
  const mobileWhatsappBtn = document.getElementById('mobile-sticky-whatsapp-btn');
  
  if (whatsappBtn) {
    const siteTel = localStorage.getItem('suv_site_tel') || '+229 01 00 00 00 00';
    let cleanTel = siteTel.replace(/\D/g, '');
    if (cleanTel.startsWith('00229')) cleanTel = cleanTel.substring(2);
    if (!cleanTel.startsWith('229')) cleanTel = '229' + cleanTel;
    
    const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
    const formattedPrice = new Intl.NumberFormat('fr-FR').format(vehicle.prix) + ' ' + currency;
    const encodedMsg = encodeURIComponent(`Bonjour Atelier Vobokun, je suis intéressé par le SUV ${vehicle.marque} ${vehicle.modele} (${vehicle.annee}) affiché à ${formattedPrice}. Est-il disponible pour un essai ?`);
    const waUrl = `https://wa.me/${cleanTel}?text=${encodedMsg}`;
    whatsappBtn.setAttribute('href', waUrl);
    if (mobileWhatsappBtn) mobileWhatsappBtn.setAttribute('href', waUrl);
  }

  if (mobileOfferBtn && openModalBtn) {
    mobileOfferBtn.addEventListener('click', () => {
      openModalBtn.click();
    });
  }

  const lightbox = document.getElementById('lightbox-container');
  const lightboxImg = document.getElementById('lightbox-img');
  const closeLightboxBtn = document.getElementById('close-lightbox-btn');

  // Miniatures gallery switcher
  document.querySelectorAll('.thumbnail-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.thumbnail-btn').forEach(b => {
        b.classList.remove('border-danger', 'ring-2');
        b.classList.add('border-secondary-subtle');
      });
      btn.classList.add('border-danger', 'ring-2');
      btn.classList.remove('border-secondary-subtle');
      
      const newSrc = btn.querySelector('img').getAttribute('src');
      if (pPhotoImg) pPhotoImg.setAttribute('src', newSrc);
    });
  });

  if (pPhoto && pPhotoImg && lightbox && lightboxImg) {
    pPhoto.addEventListener('click', () => {
      lightboxImg.setAttribute('src', pPhotoImg.getAttribute('src'));
      lightbox.classList.remove('d-none');
      lightbox.classList.add('d-flex');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeLightboxBtn && lightbox) {
    closeLightboxBtn.addEventListener('click', () => {
      lightbox.classList.add('d-none');
      lightbox.classList.remove('d-flex');
      document.body.style.overflow = '';
    });
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) {
        lightbox.classList.add('d-none');
        lightbox.classList.remove('d-flex');
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
        const icon = favBtn.querySelector('i');
        if (isFavNow) {
          icon.className = 'bi bi-heart-fill text-danger fs-5';
        } else {
          icon.className = 'bi bi-heart text-muted fs-5';
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
      
      modal.classList.remove('d-none');
      modal.classList.add('d-flex');
      document.body.style.overflow = 'hidden';
    });
  }

  const hideModal = () => {
    if (modal) {
      modal.classList.add('d-none');
      modal.classList.remove('d-flex');
    }
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
