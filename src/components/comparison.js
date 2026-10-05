import { store } from '../store.js';

let comparedVehicles = [];

export function getComparedVehicles() {
  return comparedVehicles;
}

export function isCompared(vehicleId) {
  return comparedVehicles.some(v => v.id === vehicleId);
}

export function toggleCompare(vehicle) {
  const index = comparedVehicles.findIndex(v => v.id === vehicle.id);
  if (index > -1) {
    comparedVehicles.splice(index, 1);
  } else {
    if (comparedVehicles.length >= 3) {
      alert("Vous pouvez comparer jusqu'à 3 véhicules maximum simultanément.");
      return false;
    }
    comparedVehicles.push(vehicle);
  }
  updateComparisonBar();
  updateCompareButtonsState();
  return true;
}

export function clearComparison() {
  comparedVehicles = [];
  updateComparisonBar();
  updateCompareButtonsState();
}

function updateCompareButtonsState() {
  document.querySelectorAll('.btn-compare-toggle').forEach(btn => {
    const vId = btn.getAttribute('data-vehicle-id');
    const checked = isCompared(vId);
    if (checked) {
      btn.className = 'btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1 btn-compare-toggle active';
      btn.innerHTML = `
        <i class="bi bi-check2-circle text-danger"></i>
        <span>Comparé</span>
      `;
    } else {
      btn.className = 'btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1 btn-compare-toggle';
      btn.innerHTML = `
        <i class="bi bi-arrow-left-right"></i>
        <span>Comparer</span>
      `;
    }
  });
}

export function initComparisonSystem() {
  // Ensure comparison bar container exists in body
  let bar = document.getElementById('comparison-floating-bar-root');
  if (!bar) {
    bar = document.createElement('div');
    bar.id = 'comparison-floating-bar-root';
    document.body.appendChild(bar);
  }

  // Ensure comparison modal container exists in body
  let modal = document.getElementById('comparison-modal-root');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'comparison-modal-root';
    modal.className = 'position-fixed top-0 start-0 w-100 h-100 d-none align-items-center justify-content-center p-3';
    modal.style.background = 'rgba(10, 10, 10, 0.85)';
    modal.style.backdropFilter = 'blur(8px)';
    modal.style.zIndex = '1055';
    document.body.appendChild(modal);
  }
}

export function updateComparisonBar() {
  const barRoot = document.getElementById('comparison-floating-bar-root');
  if (!barRoot) return;

  if (comparedVehicles.length === 0) {
    barRoot.innerHTML = '';
    return;
  }

  const desktopItemsHTML = comparedVehicles.map(v => `
    <div class="d-flex align-items-center gap-2 bg-light border px-2 py-1 rounded-3 small">
      <img src="${v.photos?.[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=150&q=80'}" class="rounded-2 object-fit-cover" style="width: 32px; height: 32px;">
      <span class="fw-bold text-dark text-truncate" style="max-width: 110px;">${v.marque} ${v.modele}</span>
      <button class="btn btn-sm btn-link text-muted p-0 remove-compare-btn text-decoration-none" data-vehicle-id="${v.id}" title="Retirer">
        <i class="bi bi-x-lg" style="font-size: 0.75rem;"></i>
      </button>
    </div>
  `).join('');

  const mobileThumbnailsHTML = comparedVehicles.map((v, i) => `
    <img src="${v.photos?.[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=150&q=80'}" class="rounded-circle border border-2 border-white object-fit-cover" style="width: 32px; height: 32px; margin-left: ${i > 0 ? '-10px' : '0'};" title="${v.marque} ${v.modele}">
  `).join('');

  barRoot.innerHTML = `
    <div class="toyota-panel border p-2 p-md-3 shadow-lg position-fixed bottom-0 start-50 translate-middle-x mb-2 mb-md-3 rounded-4 d-flex align-items-center justify-content-between gap-2 gap-md-3" style="z-index: 1040; max-width: 900px; width: calc(100% - 24px);">
      <!-- Desktop Left View -->
      <div class="d-none d-md-flex align-items-center gap-2 flex-wrap">
        <span class="badge bg-danger text-white text-uppercase tracking-wider px-2 py-1" style="font-size: 0.7rem;">Comparateur (${comparedVehicles.length}/3)</span>
        <div class="d-flex align-items-center gap-2 flex-wrap">
          ${desktopItemsHTML}
        </div>
      </div>

      <!-- Mobile Left View -->
      <div class="d-flex d-md-none align-items-center gap-2 min-w-0">
        <div class="d-flex align-items-center flex-shrink-0">
          ${mobileThumbnailsHTML}
        </div>
        <span class="badge bg-danger text-white text-uppercase tracking-wider px-2 py-1 flex-shrink-0" style="font-size: 0.65rem;">
          ${comparedVehicles.length}/3
        </span>
      </div>

      <!-- Actions -->
      <div class="d-flex align-items-center gap-1 gap-md-2 flex-shrink-0">
        <button id="clear-compare-btn" class="btn btn-link text-muted text-decoration-none btn-sm fw-bold text-uppercase p-1 p-md-2" style="font-size: 0.75rem;">
          <span class="d-none d-sm-inline">Vider</span>
          <i class="bi bi-trash3 d-sm-none fs-6 text-muted"></i>
        </button>
        <button id="open-compare-modal-btn" class="btn btn-toyota-red btn-sm fw-black text-uppercase px-3 py-2 shadow-sm text-nowrap" style="font-size: 0.75rem;">
          <i class="bi bi-arrow-left-right me-1"></i>
          <span>Comparer</span>
        </button>
      </div>
    </div>
  `;

  // Bind bar events
  document.querySelectorAll('.remove-compare-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const vId = btn.getAttribute('data-vehicle-id');
      const found = comparedVehicles.find(v => v.id === vId);
      if (found) toggleCompare(found);
    });
  });

  const clearBtn = document.getElementById('clear-compare-btn');
  if (clearBtn) clearBtn.addEventListener('click', clearComparison);

  const openModalBtn = document.getElementById('open-compare-modal-btn');
  if (openModalBtn) openModalBtn.addEventListener('click', openComparisonModal);
}

function openComparisonModal() {
  const modalRoot = document.getElementById('comparison-modal-root');
  if (!modalRoot) return;

  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';

  // Helper to extract numerical value from strings/numbers
  const extractNumber = (val) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const cleaned = String(val).replace(/[^0-9.,]/g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  };

  // Build columns headers
  const headersHTML = comparedVehicles.map(v => `
    <th class="p-3 text-center" style="width: 28%;">
      <div class="d-flex flex-column align-items-center gap-2">
        <img src="${v.photos?.[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=300&q=80'}" class="rounded-3 border object-fit-cover w-100" style="aspect-ratio: 16/10;">
        <div>
          <h6 class="fw-black text-dark mb-0 font-display text-uppercase">${v.marque}</h6>
          <span class="small text-danger fw-bold">${v.modele} (${v.annee})</span>
        </div>
        <button class="btn btn-outline-danger btn-sm py-1 px-2 remove-compare-btn-modal" data-vehicle-id="${v.id}" style="font-size: 0.7rem;">
          <i class="bi bi-trash3 me-1"></i>Retirer
        </button>
      </div>
    </th>
  `).join('');

  // Specs helper values
  const rows = [
    { label: "Prix de vente", key: "prix", format: (v) => new Intl.NumberFormat('fr-FR').format(v) + ' ' + currency, color: "text-danger fw-black fs-6" },
    { label: "Motorisation", key: "motorisation", format: (v) => v || 'N/A' },
    { label: "Année de fab.", key: "annee", format: (v) => v || 'N/A' },
    { label: "Puissance", key: "puissance", format: (v) => v || 'N/A' },
    { label: "0 → 100 km/h", key: "acceleration", format: (v) => v || 'N/A' },
    { label: "Transmission", key: "transmission", format: (v) => v || 'N/A' },
    { label: "Consommation", key: "consommation", format: (v) => v || 'N/A' },
    { label: "Nombre de places", key: "places", format: (v) => v ? v + ' places' : 'N/A' },
    { label: "Capacité Coffre", key: "coffre", format: (v) => v || 'N/A' },
    { label: "Couleurs dispo", key: "couleurs_dispo", format: (v) => v || 'N/A' },
    { label: "Kilométrage", key: "kilometrage", format: (v) => v ? new Intl.NumberFormat('fr-FR').format(v) + ' km' : 'N/A' },
    { label: "Statut", key: "statut", format: (v) => v === 'disponible' ? 'Disponible' : 'Vendu', color: "text-success fw-bold" }
  ];

  // Extract numerical values for stats calculations
  const specStats = {};
  const gaugeKeys = ["prix", "kilometrage", "puissance", "acceleration", "coffre"];

  gaugeKeys.forEach(key => {
    const values = comparedVehicles.map(v => extractNumber(v[key])).filter(val => val > 0);
    if (values.length > 0) {
      specStats[key] = {
        min: Math.min(...values),
        max: Math.max(...values)
      };
    }
  });

  const rowsHTML = rows.map(row => {
    const colsHTML = comparedVehicles.map(v => {
      const val = v[row.key];
      const displayVal = row.format ? row.format(val) : (val || 'N/A');
      
      let extraHTML = '';
      const stats = specStats[row.key];
      const valNum = extractNumber(val);

      if (stats && valNum > 0) {
        const percent = stats.max > 0 ? (valNum / stats.max) * 100 : 0;
        
        let badgeHTML = '';
        if (comparedVehicles.length > 1) {
          let isWinner = false;
          let badgeText = '';

          if (row.key === 'prix' && valNum === stats.min) {
            isWinner = true;
            badgeText = 'Meilleur Prix';
          } else if (row.key === 'kilometrage' && valNum === stats.min) {
            isWinner = true;
            badgeText = 'Moins Roulé';
          } else if (row.key === 'acceleration' && valNum === stats.min) {
            isWinner = true;
            badgeText = 'Plus Rapide';
          } else if (row.key === 'coffre' && valNum === stats.max) {
            isWinner = true;
            badgeText = 'Plus Spacieux';
          }

          if (isWinner && badgeText) {
            badgeHTML = `
              <div>
                <span class="badge bg-danger text-white mt-1" style="font-size: 0.65rem;">
                  <i class="bi bi-award-fill me-1"></i>${badgeText}
                </span>
              </div>
            `;
          }
        }

        extraHTML = `
          <div class="progress mt-2 mx-auto" style="height: 5px; width: 80%;">
            <div class="progress-bar bg-danger" style="width: ${percent}%;"></div>
          </div>
          ${badgeHTML}
        `;
      }

      return `
        <td class="p-3 text-center align-middle">
          <div class="small ${row.color || 'text-dark fw-semibold'}">${displayVal}</div>
          ${extraHTML}
        </td>
      `;
    }).join('');

    return `
      <tr>
        <td class="p-3 fw-bold text-uppercase small text-secondary bg-light text-start" style="font-size: 0.75rem;">${row.label}</td>
        ${colsHTML}
      </tr>
    `;
  }).join('');

  modalRoot.innerHTML = `
    <div class="toyota-panel rounded-4 w-100 shadow-2xl p-0 overflow-hidden text-start" style="max-width: 900px; max-height: 88vh; display: flex; flex-direction: column;">
      <!-- Header -->
      <div class="p-3 p-sm-4 d-flex justify-content-between align-items-center text-white" style="background: var(--toyota-red);">
        <div>
          <span class="badge bg-black text-white text-uppercase tracking-wider mb-1" style="font-size: 0.65rem;">Analyse Comparative</span>
          <h4 class="fw-black mb-0 font-display text-uppercase">Comparaison Technique</h4>
        </div>
        <button id="close-compare-modal-btn" class="btn btn-sm btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
          <i class="bi bi-x-lg"></i>
        </button>
      </div>

      <!-- Comparison Matrix Table -->
      <div class="p-3 p-sm-4 overflow-auto flex-grow-1">
        <div class="table-responsive">
          <table class="table table-hover table-bordered align-middle text-center mb-0">
            <thead class="table-light">
              <tr>
                <th class="p-3 text-start small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Caractéristiques</th>
                ${headersHTML}
              </tr>
            </thead>
            <tbody>
              ${rowsHTML}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  modalRoot.classList.remove('d-none');
  modalRoot.classList.add('d-flex');
  document.body.style.overflow = 'hidden';

  const hideComparisonModal = () => {
    modalRoot.classList.add('d-none');
    modalRoot.classList.remove('d-flex');
    document.body.style.overflow = '';
  };

  // Bind modal close events
  const closeBtn = document.getElementById('close-compare-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', hideComparisonModal);
  }

  modalRoot.addEventListener('click', (e) => {
    if (e.target === modalRoot) hideComparisonModal();
  });

  // Bind modal remove buttons
  document.querySelectorAll('.remove-compare-btn-modal').forEach(btn => {
    btn.addEventListener('click', () => {
      const vId = btn.getAttribute('data-vehicle-id');
      const found = comparedVehicles.find(v => v.id === vId);
      if (found) {
        toggleCompare(found);
        if (comparedVehicles.length === 0) {
          hideComparisonModal();
        } else {
          openComparisonModal();
        }
      }
    });
  });
}
