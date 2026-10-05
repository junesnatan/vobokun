export function renderFilters(currentFilters, uniqueBrands = []) {
  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
  const fuelTypes = ['Essence', 'Diesel', 'Hybride', 'Électrique'];
  const transmissions = ['Automatique', 'Manuelle'];

  const brandsHTML = uniqueBrands.map(brand => {
    const isChecked = currentFilters.marque.includes(brand) ? 'checked' : '';
    return `
      <label class="flex items-center gap-3 text-xs text-white/80 hover:text-white cursor-pointer py-1.5 px-2 rounded-xl hover:bg-white/5 transition-all">
        <input type="checkbox" name="marque" value="${brand}" ${isChecked} class="rounded border-white/20 bg-white/5 text-suv-gold focus:ring-suv-gold w-4 h-4 transition-colors">
        <span class="font-semibold tracking-wide">${brand}</span>
      </label>
    `;
  }).join('');

  return `
    <div class="glass-panel rounded-3xl p-6 sm:p-7 space-y-6 sticky top-24 border border-white/10 shadow-xl text-left">
      
      <!-- Filter Header -->
      <div class="flex items-center justify-between pb-4 border-b border-white/10">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-suv-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/></svg>
          <h3 class="text-xs font-black uppercase tracking-widest text-white font-display">Filtres Détaillés</h3>
        </div>
        <button id="reset-filters-btn" class="text-[11px] text-suv-gold hover:text-suv-gold-light font-bold uppercase tracking-wider transition-colors hover:underline">
          Réinitialiser
        </button>
      </div>

      <!-- Quick Search Input -->
      <div class="space-y-2 relative">
        <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Recherche directe</label>
        <div class="relative">
          <input type="text" id="filter-search-input" value="${currentFilters.search || ''}" placeholder="Modèle, mot-clé..." class="w-full suv-input pl-10 text-xs font-semibold" autocomplete="off">
          <svg class="w-4 h-4 absolute left-3.5 top-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <div id="autocomplete-suggestions" class="autocomplete-dropdown hidden"></div>
      </div>

      <!-- Brand Checkbox Deck -->
      <div class="space-y-2">
        <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Marques</label>
        <div class="flex flex-col max-h-48 overflow-y-auto pr-1 gap-0.5">
          ${brandsHTML.length > 0 ? brandsHTML : '<span class="text-xs text-white/30 py-2">Aucune marque disponible</span>'}
        </div>
      </div>

      <!-- Price Range Slider -->
      <div class="space-y-3 pt-2 border-t border-white/5">
        <div class="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
          <span class="text-white/60 text-[10px] uppercase font-bold">Budget Max</span>
          <span class="text-suv-gold font-sans text-xs font-black" id="price-val-label">
            ${new Intl.NumberFormat('fr-FR').format(currentFilters.prixMax)} ${currency}
          </span>
        </div>
        <input type="range" id="filter-price-slider" min="10000000" max="100000000" step="1000000" value="${currentFilters.prixMax}" class="w-full">
        <div class="flex justify-between text-[10px] text-white/30 font-semibold">
          <span>10 M</span>
          <span>100 M ${currency}</span>
        </div>
      </div>

      <!-- Energy Type Dropdown -->
      <div class="space-y-2">
        <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Motorisation</label>
        <select id="filter-fuel-select" class="w-full suv-input text-xs font-semibold">
          <option value="">Toutes les motorisations</option>
          ${fuelTypes.map(fuel => `
            <option value="${fuel}" ${currentFilters.carburant === fuel ? 'selected' : ''}>${fuel}</option>
          `).join('')}
        </select>
      </div>

      <!-- Transmission Dropdown -->
      <div class="space-y-2">
        <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Transmission</label>
        <select id="filter-trans-select" class="w-full suv-input text-xs font-semibold">
          <option value="">Toutes les transmissions</option>
          ${transmissions.map(trans => `
            <option value="${trans}" ${currentFilters.transmission === trans ? 'selected' : ''}>${trans}</option>
          `).join('')}
        </select>
      </div>

      <!-- Mileage Slider -->
      <div class="space-y-3 pt-2 border-t border-white/5">
        <div class="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
          <span class="text-white/60 text-[10px] uppercase font-bold">Kilométrage Max</span>
          <span class="text-suv-gold font-sans text-xs font-black" id="mileage-val-label">
            ${new Intl.NumberFormat('fr-FR').format(currentFilters.kilometrageMax)} km
          </span>
        </div>
        <input type="range" id="filter-mileage-slider" min="5000" max="200000" step="5000" value="${currentFilters.kilometrageMax}" class="w-full">
        <div class="flex justify-between text-[10px] text-white/30 font-semibold">
          <span>5 000 km</span>
          <span>200 000 km</span>
        </div>
      </div>

    </div>
  `;
}

export function initFilters(onFilterChange, onReset) {
  const searchInput = document.getElementById('filter-search-input');
  const priceSlider = document.getElementById('filter-price-slider');
  const priceLabel = document.getElementById('price-val-label');
  const fuelSelect = document.getElementById('filter-fuel-select');
  const transSelect = document.getElementById('filter-trans-select');
  const mileageSlider = document.getElementById('filter-mileage-slider');
  const mileageLabel = document.getElementById('mileage-val-label');
  const resetBtn = document.getElementById('reset-filters-btn');
  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';

  let debounceTimer = null;
  const triggerUpdate = () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const selectedBrands = Array.from(document.querySelectorAll('input[name="marque"]:checked')).map(cb => cb.value);
      
      const newFilters = {
        search: searchInput ? searchInput.value.trim() : '',
        marque: selectedBrands,
        prixMax: priceSlider ? parseFloat(priceSlider.value) : 100000000,
        carburant: fuelSelect ? fuelSelect.value : '',
        transmission: transSelect ? transSelect.value : '',
        kilometrageMax: mileageSlider ? parseInt(mileageSlider.value) : 200000
      };

      if (typeof onFilterChange === 'function') {
        onFilterChange(newFilters);
      }
    }, 120);
  };

  if (searchInput) searchInput.addEventListener('input', triggerUpdate);

  if (priceSlider && priceLabel) {
    priceSlider.addEventListener('input', () => {
      priceLabel.textContent = `${new Intl.NumberFormat('fr-FR').format(priceSlider.value)} ${currency}`;
      triggerUpdate();
    });
  }

  if (mileageSlider && mileageLabel) {
    mileageSlider.addEventListener('input', () => {
      mileageLabel.textContent = `${new Intl.NumberFormat('fr-FR').format(mileageSlider.value)} km`;
      triggerUpdate();
    });
  }

  document.querySelectorAll('input[name="marque"]').forEach(cb => {
    cb.addEventListener('change', triggerUpdate);
  });

  if (fuelSelect) fuelSelect.addEventListener('change', triggerUpdate);
  if (transSelect) transSelect.addEventListener('change', triggerUpdate);

  if (resetBtn) {
    resetBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (typeof onReset === 'function') onReset();
    });
  }
}
