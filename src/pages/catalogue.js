import { getVehicles } from '../services/vehicles.js';
import { getFavorites } from '../services/favorites.js';
import { renderFilters, initFilters } from '../components/filters.js';
import { renderVehicleCard, initVehicleCards } from '../components/vehicle-card.js';
import { store } from '../store.js';

let currentPage = 1;
const itemsPerPage = 9;
let activeSort = 'dateDesc';
let allUniqueBrands = [];

export function render() {
  return `
    <div class="container py-2 animate-fade-in text-start">
      
      <!-- Catalogue Header Showcase -->
      <div class="card toyota-card p-4 p-md-5 mb-4 border-0 shadow-sm">
        <div class="d-flex flex-column gap-2" style="max-width: 680px;">
          <span class="badge bg-danger text-uppercase px-3 py-1.5 fw-bold font-display align-self-start">
            <i class="bi bi-grid-3x3-gap-fill me-1"></i>COLLECTION OFFICIELLE VOBO<span class="text-white">KUN</span>
          </span>
          <h1 class="h2 fw-black text-dark font-display text-uppercase mb-1 tracking-tight">
            Le Showroom <span class="text-danger">Flotte Automobile</span>
          </h1>
          <p class="text-muted small mb-0 lh-base">
            Tous nos véhicules sont disponibles pour visite et essai à notre showroom de Cotonou. Tarifs certifiés concessionnaire, historique limpide et garantie 12 mois.
          </p>
        </div>

        <!-- Quick Filter Chips (Horizontal swipe on mobile) -->
        <div class="brand-scroll-track pt-3 border-top mt-3 no-scrollbar" id="quick-filter-chips">
          <button class="chip-filter btn btn-sm btn-danger fw-bold text-uppercase px-3 py-2 rounded-3" data-type="all">
            Tous les SUV
          </button>
          <button class="chip-filter btn btn-sm btn-outline-dark fw-bold text-uppercase px-3 py-2 rounded-3" data-type="brand" data-val="Toyota">
            Toyota
          </button>
          <button class="chip-filter btn btn-sm btn-outline-dark fw-bold text-uppercase px-3 py-2 rounded-3" data-type="brand" data-val="Land Rover">
            Land Rover
          </button>
          <button class="chip-filter btn btn-sm btn-outline-dark fw-bold text-uppercase px-3 py-2 rounded-3" data-type="brand" data-val="BMW">
            BMW
          </button>
          <button class="chip-filter btn btn-sm btn-outline-dark fw-bold text-uppercase px-3 py-2 rounded-3" data-type="brand" data-val="Porsche">
            Porsche
          </button>
          <button class="chip-filter btn btn-sm btn-outline-dark fw-bold text-uppercase px-3 py-2 rounded-3" data-type="fuel" data-val="Hybride">
            Hybride & Électrique
          </button>
          <button class="chip-filter btn btn-sm btn-outline-dark fw-bold text-uppercase px-3 py-2 rounded-3" data-type="budget" data-val="40000000">
            &le; 40M FCFA
          </button>
        </div>
      </div>

      <!-- Control Toolbar -->
      <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 pb-3 mb-3 border-bottom">
        <div class="d-flex align-items-center gap-2">
          <span class="spinner-grow spinner-grow-sm text-danger" role="status"></span>
          <span class="small fw-bold text-dark text-uppercase" style="font-size: 0.75rem;">
            <strong id="vehicles-total-count" class="text-danger fs-6 fw-black">8</strong> SUV DISPONIBLES
          </span>
        </div>

        <div class="d-flex align-items-center gap-2">
          <label class="toyota-spec-label mb-0 d-none d-sm-inline">Trier :</label>
          <select id="catalogue-sort-select" class="form-select toyota-input py-1.5 px-2.5 small" style="width: auto; font-size: 0.78rem;">
            <option value="dateDesc" ${activeSort === 'dateDesc' ? 'selected' : ''}>Plus récents</option>
            <option value="prixAsc" ${activeSort === 'prixAsc' ? 'selected' : ''}>Prix : Croissant</option>
            <option value="prixDesc" ${activeSort === 'prixDesc' ? 'selected' : ''}>Prix : Décroissant</option>
            <option value="kilometrageAsc" ${activeSort === 'kilometrageAsc' ? 'selected' : ''}>Kilométrage faible</option>
          </select>
        </div>
      </div>

      <!-- Mobile Filter Toggle Button (Visible only on mobile < lg) -->
      <div class="d-lg-none mb-3">
        <button class="mobile-filter-trigger w-100" type="button" id="mobile-filter-toggle-btn">
          <span class="d-flex align-items-center gap-2">
            <i class="bi bi-sliders text-danger fs-5"></i>
            <span>Affiner la recherche</span>
          </span>
          <span class="badge bg-danger rounded-pill px-2.5 py-1.5" id="mobile-filter-badge-text">Filtres</span>
        </button>
      </div>

      <!-- Main Layout Grid -->
      <div class="row g-4 align-items-start">
        
        <!-- Filters Sidebar (Collapsible on Mobile, Persistent on Desktop) -->
        <aside class="col-12 col-lg-3">
          <div class="d-none d-lg-block" id="filters-desktop-wrapper">
            <div id="filters-container">
              <!-- Rendered in init() -->
            </div>
          </div>
          <!-- Mobile Drawer Container -->
          <div class="d-lg-none d-none mb-4" id="filters-mobile-drawer">
            <div id="filters-container-mobile">
              <!-- Cloned/Rendered dynamically -->
            </div>
          </div>
        </aside>

        <!-- Product Grid Listing -->
        <div class="col-12 col-lg-9">
          
          <div id="catalogue-grid" class="row g-3 g-sm-4">
            <div class="col-12 text-center py-5 text-muted">
              Chargement instantané du showroom...
            </div>
          </div>

          <!-- Pagination Controls -->
          <div id="catalogue-pagination" class="d-flex justify-content-center align-items-center gap-2 pt-4 border-top mt-5">
            <!-- Rendered in updateCatalogue() -->
          </div>

        </div>

      </div>

    </div>
  `;
}

export async function updateCatalogue() {
  const grid = document.getElementById('catalogue-grid');
  const pag = document.getElementById('catalogue-pagination');
  const countLabel = document.getElementById('vehicles-total-count');
  
  if (!grid) return;

  try {
    const filters = store.getState().filters;
    const { data: vehicles, count, error } = await getVehicles(filters, activeSort, currentPage, itemsPerPage);

    if (error) throw error;

    let favIds = [];
    if (store.getState().user) {
      const { data: favs } = await getFavorites();
      favIds = favs.map(f => f.id);
    }

    if (countLabel) countLabel.textContent = count;

    if (vehicles.length === 0) {
      grid.innerHTML = `
        <div class="col-12 text-center py-5 card toyota-panel">
          <div class="rounded-circle bg-danger bg-opacity-10 text-danger p-3 d-inline-flex align-items-center justify-content-center mx-auto mb-3" style="width: 60px; height: 60px;">
            <i class="bi bi-search fs-3"></i>
          </div>
          <h3 class="h5 fw-black text-dark font-display text-uppercase mb-2">Aucun véhicule ne correspond</h3>
          <p class="text-muted small mb-0">Modifiez vos critères de recherche ou réinitialisez les filtres.</p>
        </div>
      `;
      if (pag) pag.innerHTML = '';
      return;
    }

    grid.innerHTML = vehicles.map(v => `
      <div class="col-12 col-md-6 col-xl-4">
        ${renderVehicleCard(v, favIds.includes(v.id))}
      </div>
    `).join('');
    initVehicleCards(grid);

    // Render Pagination
    if (pag) {
      const totalPages = Math.ceil(count / itemsPerPage);
      if (totalPages <= 1) {
        pag.innerHTML = '';
        return;
      }

      let pagHTML = '';
      
      pagHTML += `
        <button id="pag-prev" ${currentPage === 1 ? 'disabled class="btn btn-outline-secondary disabled rounded-3 px-3 py-2"' : 'class="btn btn-outline-dark rounded-3 px-3 py-2"'}>
          <i class="bi bi-chevron-left"></i>
        </button>
      `;

      for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        const btnClass = isActive 
          ? 'btn btn-danger fw-bold rounded-3 px-3 py-2' 
          : 'btn btn-outline-dark fw-bold rounded-3 px-3 py-2';
        
        pagHTML += `<button class="pag-num-btn ${btnClass}" data-page="${i}">${i}</button>`;
      }

      pagHTML += `
        <button id="pag-next" ${currentPage === totalPages ? 'disabled class="btn btn-outline-secondary disabled rounded-3 px-3 py-2"' : 'class="btn btn-outline-dark rounded-3 px-3 py-2"'}>
          <i class="bi bi-chevron-right"></i>
        </button>
      `;

      pag.innerHTML = pagHTML;
      initPaginationListeners(totalPages);
    }

  } catch (err) {
    console.error('Failed to update catalogue listing:', err);
    grid.innerHTML = `<div class="col-12 text-center py-5 text-danger fw-bold">Erreur lors de la mise à jour de la liste.</div>`;
  }
}

function initPaginationListeners(totalPages) {
  const prevBtn = document.getElementById('pag-prev');
  const nextBtn = document.getElementById('pag-next');

  if (prevBtn && currentPage > 1) {
    prevBtn.addEventListener('click', () => {
      currentPage--;
      updateCatalogue();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
  }

  if (nextBtn && currentPage < totalPages) {
    nextBtn.addEventListener('click', () => {
      currentPage++;
      updateCatalogue();
      window.scrollTo({ top: 300, behavior: 'smooth' });
    });
  }

  document.querySelectorAll('.pag-num-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.getAttribute('data-page'));
      if (p !== currentPage) {
        currentPage = p;
        updateCatalogue();
        window.scrollTo({ top: 300, behavior: 'smooth' });
      }
    });
  });
}

export async function init() {
  const filtersContainer = document.getElementById('filters-container');
  const sortSelect = document.getElementById('catalogue-sort-select');

  try {
    const { data: allVehicles } = await getVehicles({ limit: 100 });
    const brandsSet = new Set(allVehicles.map(v => v.marque));
    allUniqueBrands = Array.from(brandsSet).sort();
  } catch (e) {
    allUniqueBrands = ['Toyota', 'Land Rover', 'BMW', 'Porsche', 'Jeep', 'Audi', 'Mercedes-Benz', 'Peugeot'];
  }

  if (filtersContainer) {
    filtersContainer.innerHTML = renderFilters(store.getState().filters, allUniqueBrands);
    
    initFilters(
      (updatedFilters) => {
        store.setFilters(updatedFilters);
        currentPage = 1;
        updateCatalogue();
      },
      () => {
        store.resetFilters();
        currentPage = 1;
        filtersContainer.innerHTML = renderFilters(store.getState().filters, allUniqueBrands);
        initFilters(
          (u) => { store.setFilters(u); currentPage = 1; updateCatalogue(); },
          () => { store.resetFilters(); currentPage = 1; updateCatalogue(); }
        );
        updateCatalogue();
      }
    );
  }

  // Quick Filter Chips handling
  document.querySelectorAll('.chip-filter').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.chip-filter').forEach(c => {
        c.className = "chip-filter btn btn-sm btn-outline-dark fw-bold text-uppercase px-3 py-2 rounded-3";
      });
      chip.className = "chip-filter btn btn-sm btn-danger fw-bold text-uppercase px-3 py-2 rounded-3";

      const type = chip.getAttribute('data-type');
      const val = chip.getAttribute('data-val');

      if (type === 'all') {
        store.resetFilters();
      } else if (type === 'brand') {
        store.setFilters({ marque: [val], carburant: '', prixMax: 100000000 });
      } else if (type === 'fuel') {
        store.setFilters({ marque: [], carburant: val, prixMax: 100000000 });
      } else if (type === 'budget') {
        store.setFilters({ marque: [], carburant: '', prixMax: parseFloat(val) });
      }

      currentPage = 1;
      if (filtersContainer) {
        filtersContainer.innerHTML = renderFilters(store.getState().filters, allUniqueBrands);
        initFilters(
          (u) => { store.setFilters(u); currentPage = 1; updateCatalogue(); },
          () => { store.resetFilters(); currentPage = 1; updateCatalogue(); }
        );
      }
      updateCatalogue();
    });
  });

  // Mobile Filter Drawer Toggle
  const mobileToggleBtn = document.getElementById('mobile-filter-toggle-btn');
  const mobileDrawer = document.getElementById('filters-mobile-drawer');
  const mobileContainer = document.getElementById('filters-container-mobile');
  const mobileBadgeText = document.getElementById('mobile-filter-badge-text');

  if (mobileToggleBtn && mobileDrawer && mobileContainer) {
    mobileContainer.innerHTML = renderFilters(store.getState().filters, allUniqueBrands);
    initFilters(
      (updatedFilters) => {
        store.setFilters(updatedFilters);
        currentPage = 1;
        updateCatalogue();
      },
      () => {
        store.resetFilters();
        currentPage = 1;
        mobileContainer.innerHTML = renderFilters(store.getState().filters, allUniqueBrands);
        initFilters(
          (u) => { store.setFilters(u); currentPage = 1; updateCatalogue(); },
          () => { store.resetFilters(); currentPage = 1; updateCatalogue(); }
        );
        updateCatalogue();
      }
    );

    mobileToggleBtn.addEventListener('click', () => {
      const isHidden = mobileDrawer.classList.contains('d-none');
      if (isHidden) {
        mobileDrawer.classList.remove('d-none');
        if (mobileBadgeText) mobileBadgeText.textContent = 'Masquer';
      } else {
        mobileDrawer.classList.add('d-none');
        if (mobileBadgeText) mobileBadgeText.textContent = 'Filtres';
      }
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      currentPage = 1;
      updateCatalogue();
    });
  }

  updateCatalogue();
}
