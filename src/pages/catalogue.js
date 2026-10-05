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
    <div class="animate-fade-in space-y-10 text-left">
      
      <!-- Catalogue Header Showcase -->
      <div class="catalogue-header-showcase relative rounded-3xl p-8 sm:p-12 border border-white/10 bg-[#0E1218] overflow-hidden shadow-2xl">
        <div class="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-suv-gold/10 blur-[80px] pointer-events-none"></div>

        <div class="relative z-10 max-w-2xl space-y-3">
          <span class="inline-flex items-center gap-2 bg-suv-gold/10 text-suv-gold border border-suv-gold/25 px-3.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest font-display">
            <span class="w-1.5 h-1.5 rounded-full bg-suv-gold"></span>
            COLLECTION ATELIER VOBOKUN
          </span>
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black text-white uppercase tracking-tight font-display">
            Le Showroom <span class="text-gradient-gold">Complet.</span>
          </h1>
          <p class="text-xs sm:text-sm text-white/70 leading-relaxed font-normal">
            Tous nos véhicules sont disponibles pour visite et essai à notre showroom de Cotonou. Tarifs vérifiés, historique limpide et garantie 12 mois.
          </p>
        </div>

        <!-- Quick Filter Chips -->
        <div class="relative z-10 flex flex-wrap gap-2.5 pt-6 mt-6 border-t border-white/10" id="quick-filter-chips">
          <button class="chip-filter px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-suv-gold bg-suv-gold/15 text-suv-gold" data-type="all">
            Tous les SUV
          </button>
          <button class="chip-filter px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-white/10 bg-white/5 text-white/80 hover:border-suv-gold hover:text-white" data-type="brand" data-val="Toyota">
            Toyota
          </button>
          <button class="chip-filter px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-white/10 bg-white/5 text-white/80 hover:border-suv-gold hover:text-white" data-type="brand" data-val="Land Rover">
            Land Rover
          </button>
          <button class="chip-filter px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-white/10 bg-white/5 text-white/80 hover:border-suv-gold hover:text-white" data-type="brand" data-val="BMW">
            BMW
          </button>
          <button class="chip-filter px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-white/10 bg-white/5 text-white/80 hover:border-suv-gold hover:text-white" data-type="brand" data-val="Porsche">
            Porsche
          </button>
          <button class="chip-filter px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-white/10 bg-white/5 text-white/80 hover:border-suv-gold hover:text-white" data-type="fuel" data-val="Hybride">
            Hybride & Électrique
          </button>
          <button class="chip-filter px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-white/10 bg-white/5 text-white/80 hover:border-suv-gold hover:text-white" data-type="budget" data-val="40000000">
            &le; 40M FCFA
          </button>
        </div>
      </div>

      <!-- Control Toolbar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2">
        <div class="flex items-center gap-3">
          <div class="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
          <div class="text-xs font-bold uppercase tracking-wider text-white">
            <span id="vehicles-total-count" class="text-suv-gold font-black text-sm">8</span> SUV disponibles actuellement
          </div>
        </div>

        <div class="flex items-center gap-3">
          <label class="text-[10px] font-black uppercase tracking-widest text-suv-gray hidden sm:inline">Trier par :</label>
          <select id="catalogue-sort-select" class="suv-input py-2 px-3 text-xs font-semibold focus:border-suv-gold">
            <option value="dateDesc" ${activeSort === 'dateDesc' ? 'selected' : ''}>Plus récents d'abord</option>
            <option value="prixAsc" ${activeSort === 'prixAsc' ? 'selected' : ''}>Prix : Croissant</option>
            <option value="prixDesc" ${activeSort === 'prixDesc' ? 'selected' : ''}>Prix : Décroissant</option>
            <option value="kilometrageAsc" ${activeSort === 'kilometrageAsc' ? 'selected' : ''}>Kilométrage : Faible</option>
          </select>
        </div>
      </div>

      <!-- Main Layout Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        
        <!-- Filters Sidebar -->
        <aside class="lg:col-span-1" id="filters-container">
          <!-- Rendered in init() -->
        </aside>

        <!-- Product Grid Listing -->
        <div class="lg:col-span-3 space-y-12">
          
          <div id="catalogue-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
            <div class="col-span-full text-center py-16 text-suv-gray font-medium">
              Chargement instantané du showroom...
            </div>
          </div>

          <!-- Pagination Controls -->
          <div id="catalogue-pagination" class="flex justify-center items-center gap-2 pt-6 border-t border-white/10">
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
        <div class="col-span-full text-center py-24 glass-panel rounded-3xl border border-white/10 space-y-4">
          <div class="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-suv-gold mx-auto">
            <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          </div>
          <h3 class="text-lg font-black text-white font-display uppercase tracking-tight">Aucun véhicule ne correspond</h3>
          <p class="text-xs text-suv-gray max-w-sm mx-auto">Modifiez vos critères de recherche ou réinitialisez les filtres.</p>
        </div>
      `;
      if (pag) pag.innerHTML = '';
      return;
    }

    grid.innerHTML = vehicles.map(v => renderVehicleCard(v, favIds.includes(v.id))).join('');
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
        <button id="pag-prev" ${currentPage === 1 ? 'disabled class="p-2.5 rounded-xl border border-white/5 text-white/20 cursor-not-allowed"' : 'class="p-2.5 rounded-xl border border-white/10 text-white/80 hover:border-suv-gold hover:text-suv-gold transition-colors"'}>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
      `;

      for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        const btnClass = isActive 
          ? 'btn-premium-gold font-black w-10 h-10 rounded-xl shadow-lg'
          : 'border border-white/10 text-white/80 hover:border-suv-gold hover:text-white w-10 h-10 rounded-xl transition-colors font-bold text-xs';
        
        pagHTML += `<button class="pag-num-btn ${btnClass}" data-page="${i}">${i}</button>`;
      }

      pagHTML += `
        <button id="pag-next" ${currentPage === totalPages ? 'disabled class="p-2.5 rounded-xl border border-white/5 text-white/20 cursor-not-allowed"' : 'class="p-2.5 rounded-xl border border-white/10 text-white/80 hover:border-suv-gold hover:text-suv-gold transition-colors"'}>
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      `;

      pag.innerHTML = pagHTML;
      initPaginationListeners(totalPages);
    }

  } catch (err) {
    console.error('Failed to update catalogue listing:', err);
    grid.innerHTML = `<div class="col-span-full text-center py-12 text-rose-400">Erreur lors de la mise à jour de la liste.</div>`;
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
        c.className = "chip-filter px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-white/10 bg-white/5 text-white/80 hover:border-suv-gold hover:text-white";
      });
      chip.className = "chip-filter px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-suv-gold bg-suv-gold/15 text-suv-gold";

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

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      currentPage = 1;
      updateCatalogue();
    });
  }

  updateCatalogue();
}
