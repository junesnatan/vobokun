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
    statusBadge = `<span class="badge-toyota-red"><i class="bi bi-check-circle-fill me-1"></i>DISPONIBLE</span>`;
  } else if (statut === 'vendu') {
    statusBadge = `<span class="badge-toyota-dark"><i class="bi bi-lock-fill me-1"></i>RÉSERVÉ</span>`;
  } else {
    statusBadge = `<span class="badge-toyota-silver">ARCHIVÉ</span>`;
  }

  const favoriteIconClass = isFavorited ? 'bi-heart-fill text-danger' : 'bi-heart text-secondary';
  const compared = isCompared(id);
  const compareBtnClass = compared ? 'btn-danger' : 'btn-outline-secondary';

  return `
    <div class="card toyota-card h-100" 
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
      <div class="position-relative overflow-hidden cursor-pointer bg-dark" style="height: 220px;" data-detail-link>
        <img 
          src="${mainPhoto}" 
          alt="${marque} ${modele}" 
          class="w-100 h-100 object-fit-cover" 
          loading="lazy"
        >
        
        <!-- Gradient Bottom Shadow -->
        <div class="position-absolute bottom-0 start-0 w-100 p-2 d-flex justify-content-between align-items-end" style="background: linear-gradient(to top, rgba(0,0,0,0.65), transparent);">
          <span class="badge bg-dark bg-opacity-75 text-white fw-bold px-2 py-1 small">${annee} &middot; Certifié</span>
        </div>

        <!-- Top Left: Status Badge -->
        <div class="position-absolute top-0 start-0 m-3 z-2">
          ${statusBadge}
        </div>
 
        <!-- Top Right: Favorite Button -->
        <div class="position-absolute top-0 end-0 m-3 z-2">
          <button class="favorite-toggle-btn btn btn-light rounded-circle shadow-sm p-0 d-flex align-items-center justify-content-center" style="width: 38px; height: 38px;" title="Favoris">
            <i class="bi ${favoriteIconClass} fs-6"></i>
          </button>
        </div>
      </div>
 
      <!-- Card Information -->
      <div class="card-body p-4 d-flex flex-column justify-content-between">
        
        <div class="cursor-pointer mb-3" data-detail-link>
          <!-- Brand & Model Title -->
          <div class="text-danger fw-bold text-uppercase small font-display mb-1" style="font-size: 0.72rem; letter-spacing: 0.1em;">${marque}</div>
          <h3 class="h5 fw-black text-dark text-uppercase font-display mb-3 lh-sm text-truncate" title="${modele}">
            ${modele}
          </h3>
 
          <!-- Technical Specs Highlights -->
          <div class="row g-2 py-2 border-top border-bottom text-center mb-3">
            <div class="col-4">
              <span class="toyota-spec-label">Kilomètres</span>
              <span class="fw-bold small text-dark d-block text-truncate">${formattedMileage}</span>
            </div>
            <div class="col-4 border-start border-end">
              <span class="toyota-spec-label">Énergie</span>
              <span class="fw-bold small text-dark d-block text-truncate">${carburant}</span>
            </div>
            <div class="col-4">
              <span class="toyota-spec-label">Boîte</span>
              <span class="fw-bold small text-dark d-block text-truncate">${transmission.split(' ')[0] || 'Auto'}</span>
            </div>
          </div>
        </div>
 
        <!-- Price & Action Footer -->
        <div class="d-flex justify-content-between align-items-end pt-2 border-top">
          <div>
            <span class="toyota-spec-label mb-0">Prix Concessionnaire</span>
            <div class="fs-5 fw-black text-dark font-display mb-0">${formattedPrice}</div>
            <span class="text-muted small" style="font-size: 0.72rem;">dès ${formattedMonthly} F/mois</span>
          </div>
 
          <div class="d-flex align-items-center gap-2">
            <button class="btn-compare-toggle btn btn-sm ${compareBtnClass} rounded-3 p-2" data-vehicle-id="${id}" title="Comparer">
              <i class="bi ${compared ? 'bi-check2-square text-white' : 'bi-plus-slash-minus'} fs-6"></i>
            </button>
            <a href="/vehicle/${id}" class="btn-toyota-red py-2 px-3 rounded-3" data-link title="Voir la fiche">
              <span>Voir</span>
              <i class="bi bi-arrow-right"></i>
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
        alert("Veuillez vous connecter pour ajouter ce SUV à vos favoris.");
        navigate('/login');
        return;
      }

      try {
        const isNowFav = await toggleFavorite(id);
        const icon = btn.querySelector('i');
        if (icon) {
          if (isNowFav) {
            icon.className = 'bi bi-heart-fill text-danger fs-6';
          } else {
            icon.className = 'bi bi-heart text-secondary fs-6';
          }
        }
      } catch (err) {
        console.error('Error toggling favorite:', err);
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
        kilometrage: parseFloat(card.getAttribute('data-kilometrage')),
        carburant: card.getAttribute('data-carburant'),
        transmission: card.getAttribute('data-transmission'),
        photos: [card.getAttribute('data-photo')],
        statut: card.getAttribute('data-statut')
      };

      toggleCompare(vehicle);
    });
  });
}
