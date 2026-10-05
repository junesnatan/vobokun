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
      btn.innerHTML = `
        <svg class="w-4.5 h-4.5 text-suv-gold fill-current" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fill-rule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm9.707 5.707a1 1 0 00-1.414-1.414L9 12.586l-1.293-1.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>
        <span>Comparé</span>
      `;
      btn.classList.add('border-suv-gold/30', 'text-suv-gold');
      btn.classList.remove('border-white/10', 'text-white/60');
    } else {
      btn.innerHTML = `
        <svg class="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" /></svg>
        <span>Comparer</span>
      `;
      btn.classList.remove('border-suv-gold/30', 'text-suv-gold');
      btn.classList.add('border-white/10', 'text-white/60');
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
    modal.className = 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm hidden';
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

  const itemsHTML = comparedVehicles.map(v => `
    <div class="flex items-center gap-2 bg-white/5 border border-white/5 pl-2 pr-3 py-1.5 rounded-xl text-xs text-white/95">
      <img src="${v.photos?.[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=150&q=80'}" class="w-8 h-8 rounded-lg object-cover">
      <span class="font-bold">${v.marque} ${v.modele}</span>
      <button class="remove-compare-btn text-white/40 hover:text-suv-red ml-1 p-0.5" data-vehicle-id="${v.id}">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  `).join('');

  barRoot.innerHTML = `
    <div class="comparison-floating-bar active flex flex-col md:flex-row items-center gap-4">
      <div class="flex items-center gap-2 flex-wrap">
        <span class="text-xs font-bold text-suv-gold uppercase tracking-widest mr-2">Comparateur (${comparedVehicles.length}/3)</span>
        ${itemsHTML}
      </div>
      <div class="flex items-center gap-3">
        <button id="clear-compare-btn" class="text-xxs text-white/50 hover:text-white uppercase font-bold tracking-wider">Vider</button>
        <button id="open-compare-modal-btn" class="btn-premium-gold py-2 px-5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md">
          Lancer la comparaison
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
    <th class="p-5 text-center w-1/3 border-b border-white/5">
      <div class="space-y-3">
        <img src="${v.photos?.[0] || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=300&q=80'}" class="aspect-[16/10] rounded-xl object-cover border border-white/10 w-full">
        <div>
          <h4 class="font-extrabold text-white text-base">${v.marque}</h4>
          <p class="text-xs text-suv-gold">${v.modele} (${v.annee})</p>
        </div>
        <button class="bg-white/5 hover:bg-suv-red/10 border border-white/5 hover:border-suv-red text-white hover:text-suv-red text-[10px] font-bold py-1.5 px-3 rounded-lg transition-colors remove-compare-btn-modal" data-vehicle-id="${v.id}">
          Retirer
        </button>
      </div>
    </th>
  `).join('');

  // Specs helper values
  const rows = [
    { label: "Prix de vente", key: "prix", format: (v) => new Intl.NumberFormat('fr-FR').format(v) + ' ' + currency, color: "text-suv-gold font-bold font-sans" },
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
    { label: "Statut", key: "statut", format: (v) => v === 'disponible' ? 'Disponible' : 'Vendu', color: "text-emerald-400 font-bold" }
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
        // Calculate progress percentage relative to the max value of compared vehicles
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
              <div class="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded bg-suv-gold/10 text-[9px] font-extrabold uppercase tracking-wider text-suv-gold border border-suv-gold/20">
                <svg class="w-2.5 h-2.5 fill-current text-suv-gold" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                <span>${badgeText}</span>
              </div>
            `;
          }
        }

        extraHTML = `
          <div class="mt-2 w-28 mx-auto bg-black/20 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div class="h-full rounded-full animate-pulse-glow" style="background-color: var(--color-suv-gold); width: ${percent}%"></div>
          </div>
          ${badgeHTML}
        `;
      }

      return `
        <td class="p-4 text-center border-b border-white/5">
          <div class="text-sm ${row.color || 'text-white/80'}">${displayVal}</div>
          ${extraHTML}
        </td>
      `;
    }).join('');

    return `
      <tr class="hover:bg-white/[0.01] transition-colors">
        <td class="p-4 font-bold text-xs uppercase tracking-wider text-suv-gray border-b border-white/5 bg-white/[0.02]">${row.label}</td>
        ${colsHTML}
      </tr>
    `;
  }).join('');

  modalRoot.innerHTML = `
    <div class="glass-panel border border-white/10 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-y-auto shadow-2xl flex flex-col animate-slide-up">
      <!-- Header -->
      <div class="bg-gradient-premium-gold p-6 flex justify-between items-center text-black sticky top-0 z-10 shadow-md">
        <div>
          <span class="text-[10px] font-black uppercase tracking-widest text-black/70">Analyse Comparative</span>
          <h3 class="font-black text-xl font-display uppercase tracking-tight">Comparaison Technique</h3>
        </div>
        <button id="close-compare-modal-btn" class="p-1.5 hover:bg-black/10 rounded-xl transition-colors">
          <svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>
      </div>

      <!-- Comparison Matrix Table -->
      <div class="p-6 overflow-x-auto">
        <table class="w-full border-collapse text-left">
          <thead>
            <tr>
              <th class="p-5 border-b border-white/5 bg-white/[0.02] text-xs font-bold uppercase tracking-wider text-suv-gray">Caractéristiques</th>
              ${headersHTML}
            </tr>
          </thead>
          <tbody>
            ${rowsHTML}
          </tbody>
        </table>
      </div>
    </div>
  `;

  modalRoot.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  const hideComparisonModal = () => {
    modalRoot.classList.add('hidden');
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
        // Refresh modal or close it if no vehicles compared
        if (comparedVehicles.length === 0) {
          hideComparisonModal();
        } else {
          openComparisonModal();
        }
      }
    });
  });
}
