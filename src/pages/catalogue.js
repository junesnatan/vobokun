import { getVehicles } from '../services/vehicles.js';
import { getFavorites } from '../services/favorites.js';
import { renderFilters, initFilters } from '../components/filters.js';
import { renderVehicleCard, initVehicleCards } from '../components/vehicle-card.js';
import { store } from '../store.js';

let currentPage = 1;
const itemsPerPage = 12; // Adjusted for a better grid presentation
let activeSort = 'dateDesc';
let allUniqueBrands = [];

export function render() {
  return `
    <div class="animate-fade-in space-y-8">
      
      <!-- Catalogue Header -->
      <div class="flex flex-col md:flex-row md:items-end justify-between border-b border-white/5 pb-6 gap-4">
        <div>
          <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Showroom</span>
          <h1 class="text-3xl font-extrabold text-white mt-1">Explorez Notre Catalogue</h1>
        </div>
        
        <!-- Sort & Stats summary -->
        <div class="flex items-center gap-4 self-start md:self-end">
          <div class="text-xs text-suv-gray font-medium">
            <span id="vehicles-total-count" class="text-white font-bold">0</span> véhicules trouvés
          </div>
          <select id="catalogue-sort-select" class="suv-input py-2 px-3 bg-suv-slate border-white/10 text-xs focus:border-suv-gold">
            <option value="dateDesc" ${activeSort === 'dateDesc' ? 'selected' : ''}>Plus récents d'abord</option>
            <option value="prixAsc" ${activeSort === 'prixAsc' ? 'selected' : ''}>Prix : Croissant</option>
            <option value="prixDesc" ${activeSort === 'prixDesc' ? 'selected' : ''}>Prix : Décroissant</option>
            <option value="kilometrageAsc" ${activeSort === 'kilometrageAsc' ? 'selected' : ''}>Kilométrage : Croissant</option>
          </select>
        </div>
      </div>

      <!-- Main Layout Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        <!-- Filters sidebar panel -->
        <aside class="lg:col-span-1" id="filters-container">
          <!-- Rendered in init() -->
        </aside>

        <!-- Product grid list -->
        <div class="lg:col-span-3 space-y-12">
          <!-- Grid wrapper -->
          <div id="catalogue-grid" class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <div class="col-span-full text-center py-12 text-suv-gray">Chargement du catalogue...</div>
          </div>

          <!-- Pagination controls -->
          <div id="catalogue-pagination" class="flex justify-center items-center gap-2 pt-6 border-t border-white/5">
            <!-- Rendered in updateCatalogue() -->
          </div>
        </div>

      </div>

    </div>
  `;
}

// Update the list of vehicle cards based on filters and sorting
export async function updateCatalogue() {
  const grid = document.getElementById('catalogue-grid');
  const pag = document.getElementById('catalogue-pagination');
  const countLabel = document.getElementById('vehicles-total-count');
  
  if (!grid) return;

  grid.innerHTML = `<div class="col-span-full text-center py-12 text-suv-gray">Chargement des véhicules...</div>`;

  try {
    const filters = store.getState().filters;
    const { data: vehicles, count, error } = await getVehicles(filters, activeSort, currentPage, itemsPerPage);

    if (error) throw error;

    // Fetch user favorites list to show correct heart icon states
    let favIds = [];
    if (store.getState().user) {
      const { data: favs } = await getFavorites();
      favIds = favs.map(f => f.id);
    }

    if (countLabel) countLabel.textContent = count;

    if (vehicles.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full text-center py-20 class-panel rounded-2xl border border-white/5 space-y-4">
          <svg class="w-12 h-12 text-white/20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
          <h3 class="text-lg font-bold text-white font-display">Aucun véhicule ne correspond</h3>
          <p class="text-sm text-suv-gray max-w-sm mx-auto">Essayez de modifier vos filtres ou de réinitialiser la recherche.</p>
        </div>
      `;
      if (pag) pag.innerHTML = '';
      return;
    }

    // Render Cards
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
      
      // Previous button
      pagHTML += `
        <button id="pag-prev" ${currentPage === 1 ? 'disabled class="p-2.5 rounded-lg border border-white/5 text-white/20 cursor-not-allowed"' : 'class="p-2.5 rounded-lg border border-white/5 text-white/80 hover:bg-white/5 transition-colors"'}>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        </button>
      `;

      // Page numbers
      for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        const btnClass = isActive 
          ? 'bg-suv-red text-white font-bold w-10 h-10 rounded-lg shadow-lg shadow-suv-red/20'
          : 'border border-white/5 text-white/80 hover:bg-white/5 w-10 h-10 rounded-lg transition-colors';
        
        pagHTML += `<button class="pag-num-btn ${btnClass}" data-page="${i}">${i}</button>`;
      }

      // Next button
      pagHTML += `
        <button id="pag-next" ${currentPage === totalPages ? 'disabled class="p-2.5 rounded-lg border border-white/5 text-white/20 cursor-not-allowed"' : 'class="p-2.5 rounded-lg border border-white/5 text-white/80 hover:bg-white/5 transition-colors"'}>
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
        </button>
      `;

      pag.innerHTML = pagHTML;
      initPaginationListeners(totalPages);
    }

  } catch (err) {
    console.error('Failed to update catalogue listing:', err);
    grid.innerHTML = `<div class="col-span-full text-center py-8 text-rose-400">Erreur lors de la mise à jour de la liste.</div>`;
  }
}

// Bind pagination click handlers
function initPaginationListeners(totalPages) {
  const prevBtn = document.getElementById('pag-prev');
  const nextBtn = document.getElementById('pag-next');

  if (prevBtn && currentPage > 1) {
    prevBtn.addEventListener('click', () => {
      currentPage--;
      updateCatalogue();
    });
  }

  if (nextBtn && currentPage < totalPages) {
    nextBtn.addEventListener('click', () => {
      currentPage++;
      updateCatalogue();
    });
  }

  document.querySelectorAll('.pag-num-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const p = parseInt(btn.getAttribute('data-page'));
      if (p !== currentPage) {
        currentPage = p;
        updateCatalogue();
      }
    });
  });
}

export async function init() {
  const filtersContainer = document.getElementById('filters-container');
  const sortSelect = document.getElementById('catalogue-sort-select');

  // Load all unique brands once from database/collection to display in filter checkboxes
  try {
    const { data: allVehicles } = await getVehicles({ limit: 100 });
    // Extract unique brands
    const brandsSet = new Set(allVehicles.map(v => v.marque));
    allUniqueBrands = Array.from(brandsSet).sort();
  } catch (e) {
    console.error('Failed to load brand list:', e);
    allUniqueBrands = ['Toyota', 'Land Rover', 'BMW', 'Porsche', 'Jeep', 'Audi', 'Mercedes-Benz'];
  }

  // Initial draw of filters
  if (filtersContainer) {
    filtersContainer.innerHTML = renderFilters(store.getState().filters, allUniqueBrands);
    
    // Wire up filter controls
    initFilters(
      (updatedFilters) => {
        store.setFilters(updatedFilters);
        currentPage = 1; // Reset to page 1 on filter change
        updateCatalogue();
      },
      () => {
        store.resetFilters();
        currentPage = 1;
        
        // Re-render sidebar elements
        filtersContainer.innerHTML = renderFilters(store.getState().filters, allUniqueBrands);
        initFilters(
          (u) => { store.setFilters(u); currentPage = 1; updateCatalogue(); },
          () => { store.resetFilters(); currentPage = 1; updateCatalogue(); }
        );
        updateCatalogue();
      }
    );
  }

  // Handle sorting change
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      activeSort = e.target.value;
      currentPage = 1;
      updateCatalogue();
    });
  }

  // Load initial listings
  updateCatalogue();
}
