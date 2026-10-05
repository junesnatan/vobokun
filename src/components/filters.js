import { getVehicles } from '../services/vehicles.js';

export function renderFilters(currentFilters, uniqueBrands = []) {
  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
  const fuelTypes = ['Essence', 'Diesel', 'Hybride', 'Électrique'];
  const transmissions = ['Automatique', 'Manuelle'];

  // Brands checkboxes HTML
  const brandsHTML = uniqueBrands.map(brand => {
    const isChecked = currentFilters.marque.includes(brand) ? 'checked' : '';
    return `
      <label class="flex items-center gap-2.5 text-sm text-white/80 hover:text-white cursor-pointer py-1">
        <input type="checkbox" name="marque" value="${brand}" ${isChecked} class="rounded border-white/10 bg-white/5 text-suv-red focus:ring-suv-red w-4 h-4 transition-colors">
        <span>${brand}</span>
      </label>
    `;
  }).join('');

  return `
    <div class="glass-panel rounded-2xl p-6 space-y-6 sticky top-24 border border-white/5">
      
      <!-- Header -->
      <div class="flex items-center justify-between">
        <h3 class="text-md font-bold uppercase tracking-wider text-white font-display">Filtres</h3>
        <button id="reset-filters-btn" class="text-xs text-suv-gold hover:text-suv-yellow font-medium transition-colors">
          Réinitialiser
        </button>
      </div>

      <!-- Text Search -->
      <div class="space-y-2 relative">
        <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Recherche rapide</label>
        <div class="relative">
          <input type="text" id="filter-search-input" value="${currentFilters.search || ''}" placeholder="Ex: Land Cruiser..." class="w-full suv-input pl-10" autocomplete="off">
          <svg class="w-5 h-5 absolute left-3 top-3.5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <div id="autocomplete-suggestions" class="autocomplete-dropdown hidden"></div>
      </div>

      <!-- Brands Selection -->
      <div class="space-y-2.5">
        <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Marques</label>
        <div class="flex flex-col max-h-40 overflow-y-auto pr-1 gap-1">
          ${brandsHTML.length > 0 ? brandsHTML : '<span class="text-xs text-white/30 py-2">Aucune marque disponible</span>'}
        </div>
      </div>

      <!-- Price Range Slider -->
      <div class="space-y-3">
        <div class="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-suv-gray">
          <span>Budget Max</span>
          <span class="text-suv-gold font-sans text-sm font-bold" id="price-val-label">
            ${new Intl.NumberFormat('fr-FR').format(currentFilters.prixMax)} ${currency}
          </span>
        </div>
        <input type="range" id="filter-price-slider" min="10000000" max="100000000" step="1000000" value="${currentFilters.prixMax}" class="w-full">
        <div class="flex justify-between text-[10px] text-white/30">
          <span>10 M ${currency}</span>
          <span>100 M ${currency}</span>
        </div>
      </div>

      <!-- Fuel Type -->
      <div class="space-y-2">
        <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Carburant</label>
        <select id="filter-fuel-select" class="w-full suv-input bg-suv-slate border-white/10 text-sm focus:border-suv-gold">
          <option value="">Tous les carburants</option>
          ${fuelTypes.map(fuel => `
            <option value="${fuel}" ${currentFilters.carburant === fuel ? 'selected' : ''}>${fuel}</option>
          `).join('')}
        </select>
      </div>

      <!-- Transmission -->
      <div class="space-y-2">
        <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Transmission</label>
        <select id="filter-trans-select" class="w-full suv-input bg-suv-slate border-white/10 text-sm focus:border-suv-gold">
          <option value="">Toutes les transmissions</option>
          ${transmissions.map(trans => `
            <option value="${trans}" ${currentFilters.transmission === trans ? 'selected' : ''}>${trans}</option>
          `).join('')}
        </select>
      </div>

      <!-- Mileage Slider -->
      <div class="space-y-3">
        <div class="flex justify-between items-center text-xs font-bold uppercase tracking-wider text-suv-gray">
          <span>Kilométrage Max</span>
          <span class="text-suv-gold font-sans text-sm font-bold" id="mileage-val-label">
            ${new Intl.NumberFormat('fr-FR').format(currentFilters.kilometrageMax)} km
          </span>
        </div>
        <input type="range" id="filter-mileage-slider" min="5000" max="200000" step="5000" value="${currentFilters.kilometrageMax}" class="w-full">
        <div class="flex justify-between text-[10px] text-white/30">
          <span>5k km</span>
          <span>200k km</span>
        </div>
      </div>

    </div>
  `;
}

export function initFilters(onChangeCallback, onResetCallback) {
  const searchInput = document.getElementById('filter-search-input');
  const priceSlider = document.getElementById('filter-price-slider');
  const priceLabel = document.getElementById('price-val-label');
  const fuelSelect = document.getElementById('filter-fuel-select');
  const transSelect = document.getElementById('filter-trans-select');
  const mileageSlider = document.getElementById('filter-mileage-slider');
  const mileageLabel = document.getElementById('mileage-val-label');
  const resetBtn = document.getElementById('reset-filters-btn');

  // Helper to gather all filters state
  const getSelectedFilters = () => {
    const checkedBrands = [];
    document.querySelectorAll('input[name="marque"]:checked').forEach(box => {
      checkedBrands.push(box.value);
    });

    return {
      search: searchInput ? searchInput.value.trim() : '',
      marque: checkedBrands,
      prixMax: priceSlider ? parseInt(priceSlider.value) : 100000000,
      carburant: fuelSelect ? fuelSelect.value : '',
      transmission: transSelect ? transSelect.value : '',
      kilometrageMax: mileageSlider ? parseInt(mileageSlider.value) : 200000
    };
  };

  // Debounced/Triggered Change Handler
  let debounceTimeout = null;
  const triggerChange = (immediate = false) => {
    if (immediate) {
      onChangeCallback(getSelectedFilters());
      return;
    }
    
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      onChangeCallback(getSelectedFilters());
    }, 300); // 300ms debounce
  };

  // Autocomplete Predictive Search
  const suggestionsBox = document.getElementById('autocomplete-suggestions');
  let allVehicles = [];

  // Fetch initial list of vehicles for suggestions
  getVehicles({}, 'dateDesc', 1, 100).then(({ data }) => {
    allVehicles = data || [];
  });

  if (searchInput && suggestionsBox) {
    searchInput.addEventListener('input', () => {
      const val = searchInput.value.toLowerCase().trim();
      if (!val) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.classList.add('hidden');
        triggerChange();
        return;
      }

      // Filter matches
      const matches = allVehicles.filter(v => 
        v.marque.toLowerCase().includes(val) || 
        v.modele.toLowerCase().includes(val)
      );

      // Limit to 6 suggestions
      const subset = matches.slice(0, 6);

      if (subset.length === 0) {
        suggestionsBox.innerHTML = '<div class="p-3 text-xxs text-white/30 italic text-center">Aucune suggestion</div>';
      } else {
        suggestionsBox.innerHTML = subset.map(v => `
          <div class="autocomplete-item" data-search="${v.marque} ${v.modele}">
            <span class="font-bold text-white">${v.marque} <span class="text-white/60 font-normal">${v.modele}</span></span>
            <span class="text-[10px] text-suv-gold">${v.annee}</span>
          </div>
        `).join('');

        // Bind suggestion clicks
        suggestionsBox.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('click', () => {
            const queryVal = item.getAttribute('data-search');
            searchInput.value = queryVal;
            suggestionsBox.classList.add('hidden');
            triggerChange(true); // Trigger search immediately
          });
        });
      }

      suggestionsBox.classList.remove('hidden');
      triggerChange();
    });

    // Close dropdown on focus loss / outside click
    document.addEventListener('click', (e) => {
      if (!suggestionsBox.contains(e.target) && e.target !== searchInput) {
        suggestionsBox.classList.add('hidden');
      }
    });

    // Show dropdown again on focus if input has value
    searchInput.addEventListener('focus', () => {
      if (searchInput.value.trim().length > 0 && suggestionsBox.innerHTML) {
        suggestionsBox.classList.remove('hidden');
      }
    });
  }

  // Brand checkboxes click
  document.querySelectorAll('input[name="marque"]').forEach(box => {
    box.addEventListener('change', () => triggerChange(true));
  });

  // Price slider slide
  if (priceSlider && priceLabel) {
    const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
    priceSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      priceLabel.textContent = new Intl.NumberFormat('fr-FR').format(val) + ' ' + currency;
      triggerChange();
    });
  }

  // Fuel select
  if (fuelSelect) {
    fuelSelect.addEventListener('change', () => triggerChange(true));
  }

  // Transmission select
  if (transSelect) {
    transSelect.addEventListener('change', () => triggerChange(true));
  }

  // Mileage slider slide
  if (mileageSlider && mileageLabel) {
    mileageSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value);
      mileageLabel.textContent = new Intl.NumberFormat('fr-FR').format(val) + ' km';
      triggerChange();
    });
  }

  // Reset button action
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      onResetCallback();
    });
  }
}
