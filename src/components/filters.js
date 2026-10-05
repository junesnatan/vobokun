export function renderFilters(currentFilters, uniqueBrands = []) {
  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
  const fuelTypes = ['Essence', 'Diesel', 'Hybride', 'Électrique'];
  const transmissions = ['Automatique', 'Manuelle'];

  const brandsHTML = uniqueBrands.map(brand => {
    const isChecked = currentFilters.marque.includes(brand) ? 'checked' : '';
    return `
      <div class="form-check py-1">
        <input class="form-check-input" type="checkbox" name="marque" value="${brand}" id="brand-cb-${brand.replace(/\s+/g, '-')}" ${isChecked}>
        <label class="form-check-label small fw-bold text-dark cursor-pointer" for="brand-cb-${brand.replace(/\s+/g, '-')}">
          ${brand}
        </label>
      </div>
    `;
  }).join('');

  return `
    <div class="toyota-panel sticky-top" style="top: 96px;">
      
      <!-- Filter Header -->
      <div class="d-flex align-items-center justify-content-between pb-3 border-bottom mb-4">
        <div class="d-flex align-items-center gap-2">
          <i class="bi bi-sliders2 text-danger fs-5"></i>
          <h3 class="h6 fw-black text-uppercase font-display mb-0 text-dark">Filtres Flotte</h3>
        </div>
        <button id="reset-filters-btn" class="btn btn-sm btn-link text-danger text-decoration-none fw-bold text-uppercase p-0" style="font-size: 0.72rem;">
          Effacer tout
        </button>
      </div>

      <!-- Quick Search Input -->
      <div class="mb-4">
        <label class="toyota-spec-label mb-2">Recherche Modèle</label>
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0 border-2" style="border-color: var(--toyota-border);">
            <i class="bi bi-search text-muted"></i>
          </span>
          <input type="text" id="filter-search-input" value="${currentFilters.search || ''}" placeholder="Ex: Land Cruiser, RX, X5..." class="form-control toyota-input border-start-0" autocomplete="off">
        </div>
      </div>

      <!-- Brand Checkbox Deck -->
      <div class="mb-4">
        <label class="toyota-spec-label mb-2">Marque Automobile</label>
        <div class="p-2 border rounded-3 bg-light overflow-y-auto" style="max-height: 180px;">
          ${brandsHTML.length > 0 ? brandsHTML : '<span class="text-muted small">Aucune marque disponible</span>'}
        </div>
      </div>

      <!-- Price Range Slider -->
      <div class="mb-4 pt-2 border-top">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="toyota-spec-label mb-0">Budget Maximum</span>
          <span class="badge bg-danger fw-bold font-display" id="price-val-label">
            ${new Intl.NumberFormat('fr-FR').format(currentFilters.prixMax)} ${currency}
          </span>
        </div>
        <input type="range" id="filter-price-slider" min="10000000" max="100000000" step="1000000" value="${currentFilters.prixMax}" class="toyota-range">
        <div class="d-flex justify-content-between text-muted small fw-semibold mt-1" style="font-size: 0.72rem;">
          <span>10 M FCFA</span>
          <span>100 M FCFA</span>
        </div>
      </div>

      <!-- Energy Type Dropdown -->
      <div class="mb-4">
        <label class="toyota-spec-label mb-2">Motorisation</label>
        <select id="filter-fuel-select" class="form-select toyota-input">
          <option value="">Toutes les motorisations</option>
          ${fuelTypes.map(fuel => `
            <option value="${fuel}" ${currentFilters.carburant === fuel ? 'selected' : ''}>${fuel}</option>
          `).join('')}
        </select>
      </div>

      <!-- Transmission Dropdown -->
      <div class="mb-4">
        <label class="toyota-spec-label mb-2">Transmission</label>
        <select id="filter-trans-select" class="form-select toyota-input">
          <option value="">Toutes les boîtes</option>
          ${transmissions.map(trans => `
            <option value="${trans}" ${currentFilters.transmission === trans ? 'selected' : ''}>${trans}</option>
          `).join('')}
        </select>
      </div>

      <!-- Mileage Slider -->
      <div class="mb-2 pt-2 border-top">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="toyota-spec-label mb-0">Kilométrage Maximum</span>
          <span class="badge bg-dark fw-bold font-display" id="mileage-val-label">
            ${new Intl.NumberFormat('fr-FR').format(currentFilters.kilometrageMax)} km
          </span>
        </div>
        <input type="range" id="filter-mileage-slider" min="5000" max="200000" step="5000" value="${currentFilters.kilometrageMax}" class="toyota-range">
        <div class="d-flex justify-content-between text-muted small fw-semibold mt-1" style="font-size: 0.72rem;">
          <span>0 km</span>
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
