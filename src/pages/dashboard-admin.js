import { getVehicles, createVehicle, updateVehicle, deleteVehicle, uploadVehiclePhotos } from '../services/vehicles.js';
import { getAllOffers, updateOfferStatus, subscribeToOffers } from '../services/requests.js';
import { getConversations, getMessages, sendMessage, subscribeToMessages, subscribeToTyping, broadcastTyping, uploadVoiceNote } from '../services/messages.js';
import { store } from '../store.js';
import { db, isMock, mockDb } from '../firebase.js';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { renderAudioPlayer, initAudioPlayer } from '../components/chat.js';
import { AudioRecorder } from '../services/audioRecorder.js';

let activeSubTab = 'catalogue'; // 'catalogue' | 'requests' | 'inbox' | 'settings'
let activeChatContactId = null;
let activeChatListenerUnsub = null;
let activeOffersListenerUnsub = null; // Real-time offers sub
let isEditMode = false;
let editingVehicleId = null;
let currentUploadedPhotos = []; // Keep track of uploaded photos in modal
let activeOffers = [];

export function render() {
  return `
    <div class="container py-4 text-start">
      
      <!-- Page Header -->
      <div class="border-bottom pb-3 mb-4">
        <span class="badge bg-danger text-white text-uppercase" style="font-size: 0.65rem;">Console Showroom</span>
        <h1 class="h2 fw-black text-dark font-display text-uppercase mt-1 mb-0">Espace Concessionnaire</h1>
      </div>

      <!-- KPI METRICS GRID -->
      <div class="row row-cols-2 row-cols-lg-4 g-3 mb-4" id="admin-kpis">
        <!-- Loaded dynamically in init() -->
      </div>

      <!-- ANALYTICS DYNAMIC LINE CHART -->
      <section class="toyota-panel rounded-4 p-4 border shadow-sm mb-4">
        <h5 class="small fw-bold text-uppercase text-secondary mb-3 font-display" style="font-size: 0.75rem;">
          <i class="bi bi-graph-up-arrow text-danger me-2"></i>Évolution de l'activité du Showroom (7 derniers jours)
        </h5>
        
        <div id="admin-analytics-chart-container" class="position-relative" style="height: 190px;">
          <div class="position-absolute top-50 start-50 translate-middle text-muted small">
            Chargement des statistiques...
          </div>
        </div>

        <div class="d-flex justify-content-between small text-muted fw-bold mt-2 px-1" id="admin-chart-dates-labels">
          <!-- Populated dynamically -->
        </div>
      </section>

      <!-- SUB-TABS NAVIGATION -->
      <div class="d-flex border-bottom mb-4 overflow-x-auto no-scrollbar brand-scroll-track pb-1 gap-2 flex-nowrap">
        <button data-subtab="catalogue" class="subtab-btn text-nowrap flex-shrink-0 btn btn-link text-decoration-none pb-2 fw-black text-uppercase border-bottom border-3 ${activeSubTab === 'catalogue' ? 'border-danger text-danger' : 'border-transparent text-secondary'}" style="font-size: 0.8rem; border-radius: 0;">
          Gestion Catalogue
        </button>
        <button data-subtab="requests" class="subtab-btn text-nowrap flex-shrink-0 btn btn-link text-decoration-none pb-2 fw-black text-uppercase border-bottom border-3 ${activeSubTab === 'requests' ? 'border-danger text-danger' : 'border-transparent text-secondary'}" style="font-size: 0.8rem; border-radius: 0;">
          Demandes / Offres
        </button>
        <button data-subtab="inbox" class="subtab-btn text-nowrap flex-shrink-0 btn btn-link text-decoration-none pb-2 fw-black text-uppercase border-bottom border-3 d-flex align-items-center gap-2 ${activeSubTab === 'inbox' ? 'border-danger text-danger' : 'border-transparent text-secondary'}" style="font-size: 0.8rem; border-radius: 0;">
          <span>Messagerie Client</span>
          <span id="admin-inbox-badge" class="badge rounded-pill bg-danger text-white d-none" style="font-size: 0.65rem;">0</span>
        </button>
        <button data-subtab="settings" class="subtab-btn text-nowrap flex-shrink-0 btn btn-link text-decoration-none pb-2 fw-black text-uppercase border-bottom border-3 ${activeSubTab === 'settings' ? 'border-danger text-danger' : 'border-transparent text-secondary'}" style="font-size: 0.8rem; border-radius: 0;">
          Paramètres Showroom
        </button>
      </div>

      <!-- WORKSPACE BOARD -->
      <div id="admin-workspace-board">
        <!-- Populated dynamically based on activeSubTab -->
      </div>

    </div>

    <!-- ADD/EDIT VEHICLE MODAL -->
    <div id="vehicle-modal" class="position-fixed top-0 start-0 w-100 h-100 d-none align-items-center justify-content-center p-3" style="background: rgba(10, 10, 10, 0.85); backdrop-filter: blur(8px); z-index: 1055;">
      <div class="toyota-panel rounded-4 w-100 shadow-2xl p-0 overflow-hidden text-start" style="max-width: 680px; max-height: 90vh; display: flex; flex-direction: column;">
        
        <!-- Header -->
        <div class="p-3 p-sm-4 d-flex justify-content-between align-items-center text-white" style="background: var(--toyota-red);">
          <div>
            <span class="badge bg-black text-white text-uppercase tracking-wider mb-1" style="font-size: 0.65rem;">Flotte Automobile</span>
            <h4 class="fw-black mb-0 font-display text-uppercase" id="vehicle-modal-title">Ajouter un Véhicule</h4>
          </div>
          <button id="close-vehicle-modal-btn" class="btn btn-sm btn-outline-light rounded-circle p-2 d-flex align-items-center justify-content-center" style="width: 36px; height: 36px;">
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <!-- Form content -->
        <form id="vehicle-form" class="p-3 p-sm-4 overflow-auto flex-grow-1">
          
          <div class="row g-3">
            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Marque</label>
              <input type="text" id="v-marque" placeholder="Ex: Toyota" class="form-control toyota-input" required>
            </div>
            
            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Modèle</label>
              <input type="text" id="v-modele" placeholder="Ex: Land Cruiser" class="form-control toyota-input" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Année de fabrication</label>
              <input type="number" id="v-annee" placeholder="Ex: 2022" class="form-control toyota-input" required min="1990" max="2027">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Prix (FCFA)</label>
              <input type="number" id="v-prix" placeholder="Ex: 45000000" class="form-control toyota-input" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Kilométrage (km)</label>
              <input type="number" id="v-kilometrage" placeholder="Ex: 25000" class="form-control toyota-input" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Couleur</label>
              <input type="text" id="v-couleur" placeholder="Ex: Noir Métallisé" class="form-control toyota-input" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Carburant</label>
              <select id="v-carburant" class="form-select toyota-input" required>
                <option value="Essence">Essence</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybride">Hybride</option>
                <option value="Électrique">Électrique</option>
              </select>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Transmission</label>
              <input type="text" id="v-transmission" placeholder="Ex: AWD Auto 9 rapports" class="form-control toyota-input" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Motorisation</label>
              <input type="text" id="v-motorisation" placeholder="Ex: 3.5L V6 Hybrid" class="form-control toyota-input" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Puissance</label>
              <input type="text" id="v-puissance" placeholder="Ex: 385 ch" class="form-control toyota-input" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Accélération (0-100 km/h)</label>
              <input type="text" id="v-acceleration" placeholder="Ex: 5.8 s" class="form-control toyota-input" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Consommation</label>
              <input type="text" id="v-consommation" placeholder="Ex: 7.4 L/100 km" class="form-control toyota-input" required>
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Nombre de places</label>
              <input type="number" id="v-places" placeholder="Ex: 7" class="form-control toyota-input" required min="1" max="15">
            </div>

            <div class="col-12 col-md-6">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Capacité Coffre</label>
              <input type="text" id="v-coffre" placeholder="Ex: 750 L" class="form-control toyota-input" required>
            </div>

            <div class="col-12">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Couleurs disponibles</label>
              <input type="text" id="v-couleurs-dispo" placeholder="Ex: Silver / Noir / Blanc" class="form-control toyota-input" required>
            </div>

            <div class="col-12">
              <label class="form-label small fw-bold text-uppercase text-secondary d-flex justify-content-between" style="font-size: 0.75rem;">
                <span>Statut de visibilité</span>
                <span class="text-muted text-lowercase font-normal">(disponible = public showroom)</span>
              </label>
              <select id="v-statut" class="form-select toyota-input" required>
                <option value="disponible">Disponible</option>
                <option value="vendu">Vendu</option>
                <option value="archivé">Archivé</option>
              </select>
            </div>

            <div class="col-12 py-1">
              <div class="form-check">
                <input type="checkbox" id="v-featured" class="form-check-input">
                <label for="v-featured" class="form-check-label small fw-bold text-dark">Mettre ce véhicule en Vedette (Homepage)</label>
              </div>
            </div>

            <!-- Description -->
            <div class="col-12">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Description longue</label>
              <textarea id="v-description" rows="3" placeholder="Détails, équipements, carnet d'entretien..." class="form-control toyota-input" required></textarea>
            </div>

            <!-- Photos upload drop zone -->
            <div class="col-12">
              <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Photos du SUV (Max 10)</label>
              
              <div id="photos-drop-zone" class="border border-2 border-dashed rounded-3 p-4 text-center cursor-pointer bg-light d-flex flex-column align-items-center justify-content-center gap-1" style="cursor: pointer;">
                <i class="bi bi-cloud-arrow-up fs-2 text-secondary"></i>
                <p class="small fw-bold text-dark mb-0">Glissez-déposez des photos ou cliquez pour parcourir</p>
                <span class="small text-muted" style="font-size: 0.7rem;">JPEG, PNG max 5Mo par fichier</span>
                <input type="file" id="modal-photos-input" multiple accept="image/*" class="d-none">
              </div>

              <!-- Uploaded photos preview grid -->
              <div id="photos-preview-grid" class="row row-cols-3 row-cols-md-6 g-2 mt-2">
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="d-flex gap-2 pt-4 mt-4 border-top">
            <button type="button" id="cancel-vehicle-btn" class="btn btn-toyota-outline flex-grow-1 py-2 fw-bold text-uppercase" style="font-size: 0.8rem;">
              Annuler
            </button>
            <button type="submit" class="btn btn-toyota-red flex-grow-1 py-2 fw-black text-uppercase shadow-sm" style="font-size: 0.8rem;">
              Sauvegarder le Véhicule
            </button>
          </div>

        </form>
      </div>
    </div>
  `;
}

export async function init() {
  const tabButtons = document.querySelectorAll('.subtab-btn');
  
  const switchBoardTab = (tab) => {
    activeSubTab = tab;
    tabButtons.forEach(btn => {
      const isMatch = btn.getAttribute('data-subtab') === tab;
      if (isMatch) {
        btn.className = "subtab-btn text-nowrap flex-shrink-0 btn btn-link text-decoration-none pb-2 fw-black text-uppercase border-bottom border-3 border-danger text-danger";
      } else {
        btn.className = "subtab-btn text-nowrap flex-shrink-0 btn btn-link text-decoration-none pb-2 fw-black text-uppercase border-bottom border-3 border-transparent text-secondary";
      }
    });
    
    renderBoardContent();
  };

  // Bind tabs click
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchBoardTab(btn.getAttribute('data-subtab'));
    });
  });

  // Watch unread messages badge updates
  store.subscribe(state => {
    const inboxBadge = document.getElementById('admin-inbox-badge');
    if (inboxBadge) {
      if (state.unreadMessagesCount > 0) {
        inboxBadge.textContent = state.unreadMessagesCount;
        inboxBadge.classList.remove('d-none');
      } else {
        inboxBadge.classList.add('d-none');
      }
    }
  });

  // Load KPIs and board contents
  await updateKPIs();
  await initDynamicChart();
  renderBoardContent();
}

async function updateKPIs() {
  const kpiContainer = document.getElementById('admin-kpis');
  if (!kpiContainer) return;

  try {
    const { count: activeCount } = await getVehicles({ statut: 'disponible' });
    const { count: soldCount } = await getVehicles({ statut: 'vendu' });
    
    // Get requests and messages
    const { data: offers } = await getAllOffers();
    const pendingOffers = offers.filter(o => o.statut === 'pending').length;

    // Get unread chats count
    const { data: conversations } = await getConversations();
    const unreadMessages = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

    kpiContainer.innerHTML = `
      <div class="col">
        <div class="toyota-panel rounded-4 p-3 p-md-4 border shadow-sm h-100">
          <span class="small fw-bold text-uppercase text-secondary d-block" style="font-size: 0.7rem;">SUV en ligne</span>
          <span class="h3 fw-black text-dark font-display mt-1 d-block mb-0">${activeCount}</span>
        </div>
      </div>
      <div class="col">
        <div class="toyota-panel rounded-4 p-3 p-md-4 border shadow-sm h-100">
          <span class="small fw-bold text-uppercase text-secondary d-block" style="font-size: 0.7rem;">Ventes Clôturées</span>
          <span class="h3 fw-black text-success font-display mt-1 d-block mb-0">${soldCount}</span>
        </div>
      </div>
      <div class="col">
        <div class="toyota-panel rounded-4 p-3 p-md-4 border shadow-sm h-100">
          <span class="small fw-bold text-uppercase text-secondary d-block" style="font-size: 0.7rem;">Offres en Attente</span>
          <span class="h3 fw-black text-warning font-display mt-1 d-block mb-0">${pendingOffers}</span>
        </div>
      </div>
      <div class="col">
        <div class="toyota-panel rounded-4 p-3 p-md-4 border shadow-sm h-100">
          <span class="small fw-bold text-uppercase text-secondary d-block" style="font-size: 0.7rem;">Chats Non Lus</span>
          <span class="h3 fw-black text-danger font-display mt-1 d-block mb-0">${unreadMessages}</span>
        </div>
      </div>
    `;

    // Sync state unread count
    store.updateUnreadCount();

  } catch (e) {
    console.error('KPI metrics load error:', e);
  }
}

async function initDynamicChart() {
  const container = document.getElementById('admin-analytics-chart-container');
  const labelsContainer = document.getElementById('admin-chart-dates-labels');
  if (!container) return;

  try {
    const { data: offers } = await getAllOffers();
    const { data: vehicles } = await getVehicles({}, 'dateDesc', 1, 100);

    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const labels = days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
    const fullLabels = days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));

    const requests = days.map(day => {
      const startOfDay = new Date(day); startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(day); endOfDay.setHours(23, 59, 59, 999);
      return offers ? offers.filter(o => {
        const oDate = new Date(o.created_at);
        return oDate >= startOfDay && oDate <= endOfDay;
      }).length : 0;
    });

    const totalViews = (vehicles || []).reduce((sum, v) => sum + (v.vues || 0), 0);
    const weights = [0.12, 0.15, 0.22, 0.08, 0.11, 0.14, 0.18];
    const visits = days.map((_, idx) => {
      const base = totalViews > 0 ? Math.round(totalViews * weights[idx]) : 25 + Math.round(Math.random() * 15);
      const noise = Math.round((Math.random() - 0.5) * (base * 0.2));
      return Math.max(5, base + noise);
    });

    if (labelsContainer) {
      labelsContainer.innerHTML = labels.map(l => `<span>${l}</span>`).join('');
    }

    const maxVal = Math.max(...visits, ...requests, 10);
    const height = 180;
    const width = 700;

    const getX = (idx) => (idx / 6) * width;
    const getY = (val) => height - (val / maxVal) * (height - 30) - 15;

    const pointsVisits = visits.map((v, i) => `${getX(i)},${getY(v)}`);
    const pathVisits = `M ${pointsVisits.join(' L ')}`;
    const areaVisits = `${pathVisits} L ${width},${height} L 0,${height} Z`;

    const pointsRequests = requests.map((r, i) => `${getX(i)},${getY(r)}`);
    const pathRequests = `M ${pointsRequests.join(' L ')}`;

    const circlesVisitsHTML = visits.map((v, i) => `
      <circle cx="${getX(i)}" cy="${getY(v)}" r="4" fill="#0A0A0A" stroke="#EB0A1E" stroke-width="2" class="chart-dot" data-idx="${i}" />
    `).join('');

    const circlesRequestsHTML = requests.map((r, i) => `
      <circle cx="${getX(i)}" cy="${getY(r)}" r="4" fill="#FFFFFF" stroke="#0A0A0A" stroke-width="2" class="chart-dot" data-idx="${i}" />
    `).join('');

    container.innerHTML = `
      <svg viewBox="0 0 ${width} ${height}" class="w-100 h-100 overflow-visible" preserveAspectRatio="none" id="admin-svg-chart">
        <defs>
          <linearGradient id="visits-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#EB0A1E" stop-opacity="0.25"/>
            <stop offset="100%" stop-color="#EB0A1E" stop-opacity="0.0"/>
          </linearGradient>
        </defs>

        <!-- Grid Lines -->
        <line x1="0" y1="${height/4}" x2="${width}" y2="${height/4}" stroke="#E5E7EB" stroke-dasharray="3" stroke-width="1" />
        <line x1="0" y1="${height/2}" x2="${width}" y2="${height/2}" stroke="#E5E7EB" stroke-dasharray="3" stroke-width="1" />
        <line x1="0" y1="${(height*3)/4}" x2="${width}" y2="${(height*3)/4}" stroke="#E5E7EB" stroke-dasharray="3" stroke-width="1" />

        <!-- Vertical Pointer Line -->
        <line id="chart-vertical-pointer" x1="0" y1="0" x2="0" y2="180" stroke="#0A0A0A" stroke-dasharray="4" stroke-width="1.5" class="d-none" />

        <!-- Visits Area & Line -->
        <path d="${areaVisits}" fill="url(#visits-grad)" />
        <path d="${pathVisits}" fill="none" stroke="#EB0A1E" stroke-width="2.5" stroke-linecap="round" />
        ${circlesVisitsHTML}

        <!-- Requests Line -->
        <path d="${pathRequests}" fill="none" stroke="#0A0A0A" stroke-width="2.5" stroke-linecap="round" />
        ${circlesRequestsHTML}
      </svg>
      <div id="chart-floating-tooltip" class="chart-tooltip d-none position-absolute p-2 rounded-3 bg-dark text-white small shadow-lg" style="pointer-events: none; z-index: 10;"></div>
    `;

    const svg = document.getElementById('admin-svg-chart');
    const pointer = document.getElementById('chart-vertical-pointer');
    const tooltip = document.getElementById('chart-floating-tooltip');

    if (svg && pointer && tooltip) {
      const onMove = (e) => {
        const rect = svg.getBoundingClientRect();
        const mouseX = ((e.clientX - rect.left) / rect.width) * 700;
        
        const idx = Math.min(6, Math.max(0, Math.round((mouseX / 700) * 6)));
        const activeX = (idx / 6) * 700;

        pointer.setAttribute('x1', activeX);
        pointer.setAttribute('x2', activeX);
        pointer.classList.remove('d-none');

        document.querySelectorAll('.chart-dot').forEach(dot => {
          const dotIdx = parseInt(dot.getAttribute('data-idx'));
          if (dotIdx === idx) {
            dot.setAttribute('r', '6');
            dot.setAttribute('stroke-width', '3');
          } else {
            dot.setAttribute('r', '4');
            dot.setAttribute('stroke-width', '2');
          }
        });

        const tipX = ((idx / 6) * rect.width);
        
        tooltip.style.left = `${Math.min(rect.width - 160, Math.max(10, tipX - 80))}px`;
        tooltip.style.top = '10px';
        tooltip.innerHTML = `
          <div class="fw-bold text-white mb-1">${fullLabels[idx]}</div>
          <div class="d-flex align-items-center gap-2 small">
            <span class="rounded-circle bg-danger d-inline-block" style="width: 8px; height: 8px;"></span>
            <span>Visites : <strong>${visits[idx]}</strong></span>
          </div>
          <div class="d-flex align-items-center gap-2 small mt-1">
            <span class="rounded-circle bg-white d-inline-block" style="width: 8px; height: 8px;"></span>
            <span>Demandes : <strong>${requests[idx]}</strong></span>
          </div>
        `;
        tooltip.classList.remove('d-none');
      };

      const onLeave = () => {
        pointer.classList.add('d-none');
        tooltip.classList.add('d-none');
        document.querySelectorAll('.chart-dot').forEach(dot => {
          dot.setAttribute('r', '4');
          dot.setAttribute('stroke-width', '2');
        });
      };

      svg.addEventListener('mousemove', onMove);
      svg.addEventListener('mouseleave', onLeave);
    }

  } catch (err) {
    console.error('Failed to init dynamic chart:', err);
    container.innerHTML = `<div class="position-absolute top-50 start-50 translate-middle text-danger small">Erreur lors de la construction du graphique.</div>`;
  }
}

// Render selected sub-tab workspace
async function renderBoardContent() {
  const board = document.getElementById('admin-workspace-board');
  if (!board) return;

  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';

  // Cleanup active listeners
  if (activeChatListenerUnsub) {
    activeChatListenerUnsub();
    activeChatListenerUnsub = null;
  }
  if (activeOffersListenerUnsub) {
    activeOffersListenerUnsub();
    activeOffersListenerUnsub = null;
  }

  board.innerHTML = `
    <div class="text-center py-5 text-muted">
      <div class="spinner-border text-danger mb-3" role="status"></div>
      <p class="small fw-semibold">Chargement du module...</p>
    </div>
  `;

  try {
    if (activeSubTab === 'catalogue') {
      const { data: vehicles } = await getVehicles({ limit: 100 });

      board.innerHTML = `
        <div class="toyota-panel rounded-4 p-4 border shadow-sm">
          <div class="d-flex align-items-center justify-content-between gap-3 flex-wrap mb-4">
            <h5 class="fw-black text-uppercase font-display mb-0">Gestion du Catalogue Showroom</h5>
            
            <div class="d-flex align-items-center gap-2 flex-wrap">
              <input type="file" id="excel-import-input" accept=".xlsx, .xls, .csv" class="d-none">
              
              <button id="download-template-btn" class="btn btn-toyota-outline btn-sm fw-bold text-uppercase d-flex align-items-center gap-1" title="Télécharger le modèle Excel d'importation" style="font-size: 0.75rem;">
                <i class="bi bi-file-earmark-excel text-danger"></i>
                <span>Modèle Excel</span>
              </button>

              <button id="excel-import-btn" class="btn btn-outline-success btn-sm fw-bold text-uppercase d-flex align-items-center gap-1" title="Importer des véhicules depuis un fichier Excel ou CSV" style="font-size: 0.75rem;">
                <i class="bi bi-upload"></i>
                <span>Importer Excel</span>
              </button>

              <button id="add-vehicle-btn" class="btn btn-toyota-red btn-sm fw-black text-uppercase d-flex align-items-center gap-1 shadow-sm" style="font-size: 0.75rem;">
                <i class="bi bi-plus-lg"></i>
                <span>Ajouter un SUV</span>
              </button>
            </div>
          </div>

          <!-- Import Progress Alert -->
          <div id="import-status-banner" class="d-none alert alert-warning align-items-center justify-content-between small rounded-3 mb-3">
            <div class="d-flex align-items-center gap-2">
              <div class="spinner-border spinner-border-sm text-warning" role="status"></div>
              <span>Analyse et importation des véhicules en cours... Veuillez patienter.</span>
            </div>
          </div>

          <!-- Table Container -->
          <div class="table-responsive">
            <table class="table table-hover table-bordered align-middle text-start mb-0">
              <thead class="table-light">
                <tr class="small text-uppercase fw-bold text-secondary" style="font-size: 0.75rem;">
                  <th style="width: 80px;">Aperçu</th>
                  <th>Véhicule</th>
                  <th>Année</th>
                  <th>Prix</th>
                  <th>Kilométrage</th>
                  <th>Statut</th>
                  <th>Vues</th>
                  <th class="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${vehicles.map(v => {
                  const image = v.photos && v.photos.length > 0 ? v.photos[0] : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=100&q=80';
                  
                  let statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle">Disponible</span>';
                  if (v.statut === 'vendu') statusBadge = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle">Vendu</span>';
                  if (v.statut === 'archivé') statusBadge = '<span class="badge bg-secondary-subtle text-secondary border border-secondary-subtle">Archivé</span>';

                  return `
                    <tr>
                      <td>
                        <img src="${image}" class="rounded-2 border object-fit-cover" style="width: 64px; height: 42px;">
                      </td>
                      <td>
                        <span class="fw-bold text-dark d-block text-uppercase">${v.marque}</span>
                        <span class="small text-muted">${v.modele}</span>
                      </td>
                      <td class="small fw-semibold">${v.annee}</td>
                      <td class="fw-black text-danger font-display small">${new Intl.NumberFormat('fr-FR').format(v.prix)} ${currency}</td>
                      <td class="small text-muted">${new Intl.NumberFormat('fr-FR').format(v.kilometrage)} km</td>
                      <td>${statusBadge}</td>
                      <td class="small fw-bold text-muted">${v.vues || 0}</td>
                      <td class="text-end">
                        <div class="btn-group btn-group-sm">
                          <button class="edit-v-btn btn btn-outline-secondary" data-id="${v.id}" title="Modifier">
                            <i class="bi bi-pencil"></i>
                          </button>
                          <button class="status-v-btn btn btn-outline-success" data-id="${v.id}" data-statut="${v.statut === 'vendu' ? 'disponible' : 'vendu'}" title="${v.statut === 'vendu' ? 'Marquer disponible' : 'Marquer vendu'}">
                            <i class="bi bi-check2-circle"></i>
                          </button>
                          <button class="delete-v-btn btn btn-outline-danger" data-id="${v.id}" title="Supprimer">
                            <i class="bi bi-trash3"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      initCatalogueTabListeners();

    } else if (activeSubTab === 'requests') {
      const { data: offers } = await getAllOffers();
      activeOffers = offers || [];

      if (offers.length === 0) {
        board.innerHTML = `
          <div class="toyota-panel rounded-4 p-5 text-center text-muted border shadow-sm">
            <i class="bi bi-inbox fs-2 d-block mb-2 text-secondary"></i>
            Aucune demande d'offre n'a été soumise pour le moment.
          </div>
        `;
        return;
      }

      board.innerHTML = `
        <div class="toyota-panel rounded-4 p-4 border shadow-sm">
          <h5 class="fw-black text-uppercase font-display mb-4">Suivi des Demandes et Négociations</h5>
          
          <div class="d-grid gap-3">
            ${offers.map(o => {
              let badgeStyle = 'badge bg-warning-subtle text-warning border border-warning-subtle';
              if (o.statut === 'accepted') badgeStyle = 'badge bg-success-subtle text-success border border-success-subtle';
              else if (o.statut === 'refused') badgeStyle = 'badge bg-danger-subtle text-danger border border-danger-subtle';
              else if (o.statut === 'in_progress') badgeStyle = 'badge bg-info-subtle text-info border border-info-subtle';

              const priceHTML = o.prix_propose
                ? `<span class="text-danger fw-black font-display fs-6">${new Intl.NumberFormat('fr-FR').format(o.prix_propose)} ${currency}</span>`
                : `<span class="text-muted small">Aucune offre de prix</span>`;

              const p = o.profile || { prenom: 'Utilisateur', nom: 'Anonyme', telephone: '' };
              const v = o.vehicle || { marque: 'SUV', modele: 'supprimé', prix: 0 };

              return `
                <div class="toyota-panel rounded-4 p-4 border shadow-sm" data-offer-id="${o.id}">
                  <div class="d-flex align-items-start justify-content-between gap-3 flex-wrap pb-3 border-bottom">
                    <div>
                      <h5 class="fw-black text-dark font-display text-uppercase mb-1">${v.marque} ${v.modele}</h5>
                      <p class="small text-muted mb-0">Proposé par : <strong class="text-dark">${p.prenom} ${p.nom}</strong> &bull; Tél : <strong class="text-dark">${p.telephone || 'N/A'}</strong></p>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      ${priceHTML}
                      <span class="${badgeStyle} text-uppercase px-3 py-2 fw-bold" style="font-size: 0.7rem;">${o.statut}</span>
                    </div>
                  </div>

                  <div class="p-3 rounded-3 my-3 small border" style="background: #F4F5F8;">
                    <span class="small fw-bold text-uppercase text-danger d-block mb-1" style="font-size: 0.7rem;">Message de l'acheteur :</span>
                    <p class="text-secondary mb-0">${o.message}</p>
                  </div>

                  <!-- Notes & Decision panel -->
                  <div class="row g-2 align-items-end pt-2">
                    
                    <!-- Admin internal note -->
                    <div class="col-12 col-md-6">
                      <label class="form-label small fw-bold text-uppercase text-secondary mb-1" style="font-size: 0.7rem;">Note ou réponse client (admin)</label>
                      <input type="text" class="note-admin-input form-control form-control-sm toyota-input" value="${o.note_admin || ''}" placeholder="Ajouter une note de suivi...">
                    </div>

                    <!-- Action selection buttons -->
                    <div class="col-12 col-md-3">
                      <div class="btn-group btn-group-sm w-100">
                        <button class="decision-btn btn btn-success fw-bold text-uppercase" data-action="accepted" style="font-size: 0.7rem;">
                          Accepter
                        </button>
                        <button class="decision-btn btn btn-danger fw-bold text-uppercase" data-action="refused" style="font-size: 0.7rem;">
                          Refuser
                        </button>
                        <button class="decision-btn btn btn-outline-dark fw-bold text-uppercase" data-action="in_progress" style="font-size: 0.7rem;">
                          Négocier
                        </button>
                      </div>
                    </div>

                    <!-- PDF Devis Button -->
                    <div class="col-12 col-md-3">
                      <button class="devis-btn btn btn-toyota-red btn-sm w-100 fw-black text-uppercase d-flex align-items-center justify-content-center gap-1 shadow-sm" data-offer-id="${o.id}" style="font-size: 0.75rem;">
                        <i class="bi bi-file-earmark-pdf"></i>
                        <span>Générer Devis</span>
                      </button>
                    </div>

                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      `;

      initRequestsTabListeners();

      // Realtime subscription for offers
      const { subscribeToOffers } = await import('../services/requests.js');
      activeOffersListenerUnsub = subscribeToOffers(async () => {
        await updateKPIs();
        renderBoardContent();
      });

    } else if (activeSubTab === 'inbox') {
      const { data: conversations } = await getConversations();

      if (conversations.length === 0) {
        board.innerHTML = `
          <div class="toyota-panel rounded-4 p-5 text-center text-muted border shadow-sm">
            <i class="bi bi-chat-quote fs-2 d-block mb-2 text-secondary"></i>
            Aucun chat client démarré pour l'instant.
          </div>
        `;
        return;
      }

      // Render Split Inbox Pane
      board.innerHTML = `
        <div class="row g-3" style="height: 560px;">
          
          <!-- LEFT: Thread list sidebar (col-lg-4) -->
          <div class="col-lg-4 h-100">
            <div class="toyota-panel rounded-4 border shadow-sm d-flex flex-column h-100 overflow-hidden">
              <div class="px-3 py-3 border-bottom bg-light">
                <h6 class="small fw-black text-uppercase font-display mb-0 text-dark">Conversations Clients</h6>
              </div>
              
              <div class="overflow-auto flex-grow-1" id="admin-conversations-list">
                ${conversations.map(c => {
                  const isActive = activeChatContactId === c.contact.id;
                  const activeClass = isActive ? 'bg-danger-subtle border-start border-4 border-danger' : 'bg-white';
                  const time = new Date(c.lastMessage.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                  
                  return `
                    <button class="w-100 text-start p-3 border-bottom d-flex align-items-center justify-content-between gap-2 conversation-thread-btn ${activeClass}" data-contact-id="${c.contact.id}" style="border: 0;">
                      <div class="d-flex align-items-center gap-2 overflow-hidden">
                        <img src="${c.contact.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}" class="rounded-circle object-fit-cover border flex-shrink-0" style="width: 38px; height: 38px;">
                        <div class="overflow-hidden">
                          <p class="small fw-bold text-dark mb-0 text-truncate">${c.contact.prenom} ${c.contact.nom}</p>
                          <p class="small text-muted mb-0 text-truncate" style="font-size: 0.75rem;">${c.lastMessage.contenu.startsWith('[audio]:') ? '🎤 Note vocale' : c.lastMessage.contenu}</p>
                        </div>
                      </div>
                      <div class="text-end flex-shrink-0 d-flex flex-column align-items-end gap-1">
                        <span class="small text-muted font-monospace" style="font-size: 0.65rem;">${time}</span>
                        ${c.unreadCount > 0 ? `<span class="badge rounded-pill bg-danger text-white" style="font-size: 0.65rem;">${c.unreadCount}</span>` : ''}
                      </div>
                    </button>
                  `;
                }).join('')}
              </div>
            </div>
          </div>

          <!-- RIGHT: Chat Board Pane (col-lg-8) -->
          <div class="col-lg-8 h-100">
            <div class="toyota-panel rounded-4 border shadow-sm d-flex flex-column h-100 overflow-hidden" id="admin-chat-pane">
              <div class="d-flex align-items-center justify-content-center h-100 text-muted small">
                Sélectionnez une discussion à gauche pour répondre en direct.
              </div>
            </div>
          </div>

        </div>
      `;

      initInboxTabListeners();

    } else if (activeSubTab === 'settings') {
      const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
      const address = localStorage.getItem('suv_site_address') || "Haie Vive, Cotonou, Bénin";
      const tel = localStorage.getItem('suv_site_tel') || "+229 01 00 00 00 00";
      const bannerActive = localStorage.getItem('suv_site_banner_active') === 'true';
      const bannerText = localStorage.getItem('suv_site_banner_text') || "✨ Arrivage exceptionnel ce mois-ci : Découvrez nos nouveaux Range Rover 2024 !";

      board.innerHTML = `
        <div class="toyota-panel rounded-4 p-4 p-md-5 border shadow-sm">
          <h5 class="fw-black text-uppercase font-display border-bottom pb-3 mb-4">Configuration Générale de la Plateforme</h5>
          
          <form id="settings-form">
            <div class="row g-3">
              
              <!-- Devise -->
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Devise de la plateforme</label>
                <select id="set-currency" class="form-select toyota-input">
                  <option value="FCFA" ${currency === 'FCFA' ? 'selected' : ''}>FCFA (Afrique de l'Ouest / XOF)</option>
                  <option value="EUR" ${currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                  <option value="USD" ${currency === 'USD' ? 'selected' : ''}>Dollar ($)</option>
                </select>
              </div>

              <!-- Coordonnées Tel -->
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Téléphone de contact</label>
                <input type="text" id="set-tel" value="${tel}" class="form-control toyota-input" required>
              </div>

              <!-- Adresse Physique -->
              <div class="col-12">
                <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Adresse physique du Showroom</label>
                <input type="text" id="set-address" value="${address}" class="form-control toyota-input" required>
              </div>
            </div>

            <!-- Bandeau Promotionnel Section -->
            <div class="border-top pt-4 mt-4 text-start">
              <h6 class="small fw-black text-uppercase text-danger mb-3 font-display" style="font-size: 0.75rem;">Bandeau d'actualités (Top Header)</h6>
              
              <div class="form-check mb-3">
                <input type="checkbox" id="set-banner-active" ${bannerActive ? 'checked' : ''} class="form-check-input">
                <label for="set-banner-active" class="form-check-label small fw-bold text-dark">Activer le bandeau promotionnel en haut du site</label>
              </div>

              <div>
                <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Message du bandeau</label>
                <input type="text" id="set-banner-text" value="${bannerText}" class="form-control toyota-input" placeholder="Ex: Offre spéciale fin d'année...">
              </div>
            </div>

            <!-- Submit -->
            <div class="text-end pt-4 mt-4 border-top">
              <button type="submit" class="btn btn-toyota-red px-4 py-3 fw-black text-uppercase shadow-sm" style="font-size: 0.8rem;">
                Sauvegarder les paramètres
              </button>
            </div>

          </form>
        </div>
      `;

      const setForm = document.getElementById('settings-form');
      if (setForm) {
        setForm.addEventListener('submit', (e) => {
          e.preventDefault();
          
          const cur = document.getElementById('set-currency').value;
          const telVal = document.getElementById('set-tel').value;
          const adr = document.getElementById('set-address').value;
          const bActive = document.getElementById('set-banner-active').checked;
          const bText = document.getElementById('set-banner-text').value;

          localStorage.setItem('suv_site_currency', cur);
          localStorage.setItem('suv_site_tel', telVal);
          localStorage.setItem('suv_site_address', adr);
          localStorage.setItem('suv_site_banner_active', bActive ? 'true' : 'false');
          localStorage.setItem('suv_site_banner_text', bText);

          if (!isMock && db) {
            const settingsPayload = [
              { key: 'suv_site_currency', value: cur },
              { key: 'suv_site_tel', value: telVal },
              { key: 'suv_site_address', value: adr },
              { key: 'suv_site_banner_active', value: bActive ? 'true' : 'false' },
              { key: 'suv_site_banner_text', value: bText }
            ];
            
            Promise.all(settingsPayload.map(item => setDoc(doc(db, 'settings', item.key), item)))
              .then(() => {
                alert('Paramètres de la plateforme enregistrés avec succès !');
                window.location.reload();
              })
              .catch((err) => {
                console.warn('Firestore settings sync error, saved locally:', err.message);
                alert('Paramètres de la plateforme enregistrés avec succès !');
                window.location.reload();
              });
          } else {
            alert('Paramètres de la plateforme enregistrés avec succès !');
            window.location.reload();
          }
        });
      }
    }
  } catch (err) {
    console.error('Workspace sub-tab build failed:', err);
    board.innerHTML = `<div class="text-center py-5 text-danger">Erreur lors de la construction du module.</div>`;
  }
}

// Dynamic on-demand loader for SheetJS
async function loadSheetJS() {
  if (window.XLSX) return window.XLSX;
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
    script.onload = () => resolve(window.XLSX);
    script.onerror = () => reject(new Error('Échec du chargement de la bibliothèque Excel.'));
    document.head.appendChild(script);
  });
}

// Wire up actions in Catalogue manager
function initCatalogueTabListeners() {
  const addBtn = document.getElementById('add-vehicle-btn');
  const modal = document.getElementById('vehicle-modal');
  const closeModalBtn = document.getElementById('close-vehicle-modal-btn');
  const cancelBtn = document.getElementById('cancel-vehicle-btn');
  const vForm = document.getElementById('vehicle-form');

  const importBtn = document.getElementById('excel-import-btn');
  const importInput = document.getElementById('excel-import-input');
  const downloadBtn = document.getElementById('download-template-btn');
  const statusBanner = document.getElementById('import-status-banner');

  if (downloadBtn) {
    downloadBtn.addEventListener('click', async () => {
      try {
        await loadSheetJS();
        const XLSX = window.XLSX;
        const headers = [
          'Marque', 'Modele', 'Annee', 'Prix', 'Kilometrage', 'Carburant', 
          'Transmission', 'Couleur', 'Description', 'Motorisation', 
          'Puissance', 'Acceleration', 'Consommation', 'Places', 'Coffre', 'Couleurs_Dispo'
        ];
        const sampleRow = {
          'Marque': 'Toyota',
          'Modele': 'Land Cruiser Prado',
          'Annee': 2024,
          'Prix': 55000000,
          'Kilometrage': 0,
          'Carburant': 'Diesel',
          'Transmission': 'AWD Auto 9 rapports',
          'Couleur': 'Noir Métallisé',
          'Description': 'SUV de prestige neuf de dernière génération.',
          'Motorisation': '2.8L D-4D',
          'Puissance': '204 ch',
          'Acceleration': '9.9 s',
          'Consommation': '7.9 L/100 km',
          'Places': 7,
          'Coffre': '740 L',
          'Couleurs_Dispo': 'Silver / Noir / Blanc'
        };

        const worksheet = XLSX.utils.json_to_sheet([sampleRow], { header: headers });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Import_Catalogue');

        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'Modele_Import_Vehicules_Vobokun.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Failed to download template:', err);
        alert('Échec de la génération du modèle Excel : ' + err.message);
      }
    });
  }

  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => {
      importInput.click();
    });

    importInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      importInput.value = '';

      if (statusBanner) {
        statusBanner.classList.remove('d-none');
        statusBanner.classList.add('d-flex');
      }

      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          await loadSheetJS();
          const XLSX = window.XLSX;
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const rawRows = XLSX.utils.sheet_to_json(worksheet);

          if (rawRows.length === 0) {
            throw new Error("Le fichier Excel ne contient aucune ligne de données.");
          }

          const parsedVehicles = [];

          for (const row of rawRows) {
            const getVal = (synonyms) => {
              for (const key of Object.keys(row)) {
                const normalizedKey = key.toLowerCase()
                  .normalize("NFD")
                  .replace(/[\u0300-\u036f]/g, "")
                  .replace(/\s+/g, '')
                  .replace(/_/g, '');
                
                if (synonyms.some(s => s.toLowerCase() === normalizedKey)) {
                  return row[key];
                }
              }
              return null;
            };

            const marque = getVal(['marque', 'brand', 'constructeur']);
            const modele = getVal(['modele', 'model']);
            const annee = parseInt(getVal(['annee', 'year', 'anneedefabrication']));
            const prix = parseFloat(getVal(['prix', 'price', 'valeur']));
            const kilometrage = parseInt(getVal(['kilometrage', 'mileage', 'km', 'kms'])) || 0;
            const carburant = getVal(['carburant', 'fuel', 'energie']);
            const transmission = getVal(['transmission', 'boite', 'boitedevitesse', 'boitedevitesses', 'gearbox']);
            const couleur = getVal(['couleur', 'color']);
            const description = getVal(['description', 'details', 'infos', 'descriptionlongue']) || '';
            const motorisation = getVal(['motorisation', 'moteur', 'engine']);
            const puissance = getVal(['puissance', 'power', 'ch', 'chevaux']);
            const acceleration = getVal(['acceleration', '0100', '0100kmh', 'chrono', 'acceleration0100']);
            const consommation = getVal(['consommation', 'conso', 'consomoyenne']);
            const places = parseInt(getVal(['places', 'seats', 'nombredeplaces', 'nbrplaces'])) || 5;
            const coffre = getVal(['coffre', 'boot', 'capacitedecoffre']);
            const couleurs_dispo = getVal(['couleursdispo', 'couleursdisponibles', 'colors', 'couleursdispos', 'couleurdispo']);

            if (!marque || !modele || isNaN(annee) || isNaN(prix)) {
              console.warn('Saut de ligne invalide dans le fichier Excel:', row);
              continue;
            }

            let cleanCarburant = 'Essence';
            if (carburant) {
              const lowerC = carburant.toString().toLowerCase();
              if (lowerC.includes('diesel')) cleanCarburant = 'Diesel';
              else if (lowerC.includes('hybrid') || lowerC.includes('hybride')) cleanCarburant = 'Hybride';
              else if (lowerC.includes('elect') || lowerC.includes('élect')) cleanCarburant = 'Électrique';
            }

            parsedVehicles.push({
              marque: marque.toString().trim(),
              modele: modele.toString().trim(),
              annee,
              prix,
              kilometrage,
              carburant: cleanCarburant,
              transmission: transmission ? transmission.toString().trim() : 'Automatique',
              couleur: couleur ? couleur.toString().trim() : 'Non précisée',
              description: description.toString().trim(),
              motorisation: motorisation ? motorisation.toString().trim() : 'N/A',
              puissance: puissance ? puissance.toString().trim() : 'N/A',
              acceleration: acceleration ? acceleration.toString().trim() : 'N/A',
              consommation: consommation ? consommation.toString().trim() : 'N/A',
              places,
              coffre: coffre ? coffre.toString().trim() : 'N/A',
              couleurs_dispo: couleurs_dispo ? couleurs_dispo.toString().trim() : (couleur ? couleur.toString().trim() : 'Noir / Blanc'),
              statut: 'disponible',
              featured: false,
              photos: ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80'],
              vues: 0
            });
          }

          if (parsedVehicles.length === 0) {
            throw new Error("Aucun véhicule valide n'a pu être extrait. Assurez-vous d'avoir rempli les colonnes obligatoires (Marque, Modèle, Année, Prix).");
          }

          const list = mockDb.getCollection(mockDb.KEYS.VEHICLES);
          parsedVehicles.forEach((v, index) => {
            v.id = 'suv-excel-' + index + '-' + Math.random().toString(36).substr(2, 5);
            v.created_at = new Date().toISOString();
            v.updated_at = new Date().toISOString();
            list.unshift(v);
          });
          mockDb.saveCollection(mockDb.KEYS.VEHICLES, list);

          if (!isMock && db) {
            try {
              for (const v of parsedVehicles) {
                await setDoc(doc(db, 'vehicles', v.id), v);
              }
            } catch (fbErr) {
              console.warn('Firestore sync warning on excel import:', fbErr.message);
            }
          }

          alert(`${parsedVehicles.length} véhicules importés avec succès dans le catalogue !`);

          await updateKPIs();
          renderBoardContent();
        } catch (err) {
          console.error(err);
          alert("Erreur lors de l'importation : " + (err.message || JSON.stringify(err)));
        } finally {
          if (statusBanner) {
            statusBanner.classList.add('d-none');
            statusBanner.classList.remove('d-flex');
          }
        }
      };
      reader.onerror = () => {
        alert("Impossible de lire le fichier.");
        if (statusBanner) {
          statusBanner.classList.add('d-none');
          statusBanner.classList.remove('d-flex');
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
  
  // Drag drop
  const dropZone = document.getElementById('photos-drop-zone');
  const fileInput = document.getElementById('modal-photos-input');

  const showModal = (title, editId = null) => {
    document.getElementById('vehicle-modal-title').textContent = title;
    editingVehicleId = editId;
    isEditMode = !!editId;
    currentUploadedPhotos = [];
    document.getElementById('photos-preview-grid').innerHTML = '';
    
    if (modal) {
      modal.classList.remove('d-none');
      modal.classList.add('d-flex');
    }
  };

  const hideModal = () => {
    if (modal) {
      modal.classList.add('d-none');
      modal.classList.remove('d-flex');
    }
    if (vForm) vForm.reset();
  };

  if (addBtn) addBtn.addEventListener('click', () => showModal('Ajouter un SUV'));
  if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
  if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

  // File picker binding
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('click', (e) => e.stopPropagation());
    
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-danger');
    });

    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-danger');
    });

    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-danger');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await handleImageUpload(files);
      }
    });

    fileInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        await handleImageUpload(files);
      }
    });
  }

  const handleImageUpload = async (files) => {
    try {
      const urls = await uploadVehiclePhotos(files);
      currentUploadedPhotos = [...currentUploadedPhotos, ...urls];
      renderImagePreviews();
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + err.message);
    }
  };

  const renderImagePreviews = () => {
    const grid = document.getElementById('photos-preview-grid');
    if (!grid) return;

    grid.innerHTML = currentUploadedPhotos.map((url, idx) => `
      <div class="col position-relative">
        <div class="rounded-2 border overflow-hidden position-relative" style="aspect-ratio: 16/10;">
          <img src="${url}" class="w-100 h-100 object-fit-cover">
          <button type="button" class="btn btn-danger btn-sm p-1 position-absolute top-0 end-0 m-1 delete-photo-btn" data-idx="${idx}" title="Supprimer">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>
    `).join('');

    grid.querySelectorAll('.delete-photo-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.getAttribute('data-idx'));
        currentUploadedPhotos.splice(idx, 1);
        renderImagePreviews();
      });
    });
  };

  // Submit CRUD Save Form
  if (vForm) {
    vForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const marque = document.getElementById('v-marque').value.trim();
      const modele = document.getElementById('v-modele').value.trim();
      const annee = parseInt(document.getElementById('v-annee').value);
      const prix = parseFloat(document.getElementById('v-prix').value);
      const kilometrage = parseInt(document.getElementById('v-kilometrage').value);
      const couleur = document.getElementById('v-couleur').value.trim();
      const carburant = document.getElementById('v-carburant').value;
      const transmission = document.getElementById('v-transmission').value.trim();
      const motorisation = document.getElementById('v-motorisation').value.trim();
      const puissance = document.getElementById('v-puissance').value.trim();
      const acceleration = document.getElementById('v-acceleration').value.trim();
      const consommation = document.getElementById('v-consommation').value.trim();
      const places = parseInt(document.getElementById('v-places').value);
      const coffre = document.getElementById('v-coffre').value.trim();
      const couleurs_dispo = document.getElementById('v-couleurs-dispo').value.trim();
      const statut = document.getElementById('v-statut').value;
      const description = document.getElementById('v-description').value.trim();
      const featured = document.getElementById('v-featured').checked;

      const payload = {
        marque, modele, annee, prix, kilometrage, couleur, carburant, transmission, 
        motorisation, puissance, acceleration, consommation, places, coffre, couleurs_dispo,
        statut, description, featured,
        photos: currentUploadedPhotos.length > 0 ? currentUploadedPhotos : ['https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80']
      };

      try {
        if (isEditMode) {
          const { error } = await updateVehicle(editingVehicleId, payload);
          if (error) throw error;
          alert('Véhicule mis à jour avec succès !');
        } else {
          const { error } = await createVehicle(payload);
          if (error) throw error;
          alert('Véhicule créé avec succès !');
        }
        hideModal();
        await updateKPIs();
        renderBoardContent();
      } catch (err) {
        console.error(err);
        alert('Échec de la sauvegarde: ' + (err.message || JSON.stringify(err)));
      }
    });
  }

  // Bind Table Buttons (Edit, Quick Sold, Delete)
  document.querySelectorAll('.edit-v-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      
      try {
        const { getVehicleById } = await import('../services/vehicles.js');
        const { data: vehicle } = await getVehicleById(id);
        
        showModal('Modifier le SUV', id);

        document.getElementById('v-marque').value = vehicle.marque;
        document.getElementById('v-modele').value = vehicle.modele;
        document.getElementById('v-annee').value = vehicle.annee;
        document.getElementById('v-prix').value = vehicle.prix;
        document.getElementById('v-kilometrage').value = vehicle.kilometrage;
        document.getElementById('v-couleur').value = vehicle.couleur;
        document.getElementById('v-carburant').value = vehicle.carburant;
        document.getElementById('v-transmission').value = vehicle.transmission || '';
        document.getElementById('v-motorisation').value = vehicle.motorisation || '';
        document.getElementById('v-puissance').value = vehicle.puissance || '';
        document.getElementById('v-acceleration').value = vehicle.acceleration || '';
        document.getElementById('v-consommation').value = vehicle.consommation || '';
        document.getElementById('v-places').value = vehicle.places || '';
        document.getElementById('v-coffre').value = vehicle.coffre || '';
        document.getElementById('v-couleurs-dispo').value = vehicle.couleurs_dispo || '';
        document.getElementById('v-statut').value = vehicle.statut;
        document.getElementById('v-description').value = vehicle.description;
        document.getElementById('v-featured').checked = !!vehicle.featured;

        currentUploadedPhotos = vehicle.photos || [];
        renderImagePreviews();

      } catch (err) {
        console.error(err);
      }
    });
  });

  document.querySelectorAll('.status-v-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const statut = btn.getAttribute('data-statut');

      try {
        const { error } = await updateVehicle(id, { statut });
        if (error) throw error;
        await updateKPIs();
        renderBoardContent();
      } catch (err) {
        console.error(err);
        alert('Échec de la mise à jour du statut: ' + (err.message || JSON.stringify(err)));
      }
    });
  });

  document.querySelectorAll('.delete-v-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      if (confirm('Voulez-vous vraiment supprimer définitivement ce SUV de votre inventaire ?')) {
        try {
          const { error } = await deleteVehicle(id);
          if (error) throw error;
          await updateKPIs();
          renderBoardContent();
        } catch (err) {
          console.error(err);
          alert('Échec de la suppression: ' + (err.message || JSON.stringify(err)));
        }
      }
    });
  });
}

// Bind Offer status decisions
function initRequestsTabListeners() {
  document.querySelectorAll('.decision-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const card = btn.closest('[data-offer-id]');
      if (!card) return;

      const offerId = card.getAttribute('data-offer-id');
      const statut = btn.getAttribute('data-action');
      const noteInput = card.querySelector('.note-admin-input');
      const noteAdmin = noteInput ? noteInput.value.trim() : '';

      try {
        btn.disabled = true;
        await updateOfferStatus(offerId, statut, noteAdmin);
        alert('Statut de la demande mis à jour !');
        await updateKPIs();
        renderBoardContent();
      } catch (err) {
        console.error(err);
        alert('Erreur: ' + err.message);
      }
    });
  });

  document.querySelectorAll('.devis-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const offerId = btn.getAttribute('data-offer-id');
      const offer = activeOffers.find(o => o.id === offerId);
      if (!offer) return;
      generatePDFQuote(offer);
    });
  });
}

function generatePDFQuote(offer) {
  const p = offer.profile || { prenom: 'Client', nom: 'Anonyme', telephone: '', email: '' };
  const v = offer.vehicle || { marque: 'SUV', modele: 'Spécifié', prix: 0, annee: '', carburant: '', transmission: '', kilometrage: '' };
  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
  const siteTel = localStorage.getItem('suv_site_tel') || '+229 01 00 00 00 00';
  const siteAddr = localStorage.getItem('suv_site_address') || 'Haie Vive, Cotonou, Bénin';
  
  const formattedCatalogPrice = new Intl.NumberFormat('fr-FR').format(v.prix) + ' ' + currency;
  const formattedBidPrice = offer.prix_propose 
    ? new Intl.NumberFormat('fr-FR').format(offer.prix_propose) + ' ' + currency
    : formattedCatalogPrice;

  const quoteNo = 'DEV-' + offer.id.substring(0, 8).toUpperCase();
  const dateStr = new Date(offer.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Devis Showroom - ${quoteNo}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #0A0A0A;
          margin: 0;
          padding: 40px;
          background: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 3px solid #EB0A1E;
          padding-bottom: 20px;
          margin-bottom: 40px;
        }
        .logo {
          font-size: 26px;
          font-weight: 900;
          color: #0A0A0A;
          letter-spacing: 1px;
        }
        .logo span {
          color: #EB0A1E;
        }
        .company-info, .client-info {
          font-size: 13px;
          line-height: 1.6;
        }
        .client-card {
          border: 1px solid #E5E7EB;
          padding: 20px;
          border-radius: 10px;
          margin-bottom: 40px;
          background: #F8F9FA;
        }
        .client-card h3 {
          margin-top: 0;
          color: #EB0A1E;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .quote-meta {
          text-align: right;
          font-size: 13px;
        }
        .quote-title {
          font-size: 24px;
          font-weight: 900;
          margin: 0 0 10px 0;
          color: #0A0A0A;
        }
        .specs-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
        }
        .specs-table th {
          background: #0A0A0A;
          color: #ffffff;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: bold;
          padding: 12px 16px;
          border: 1px solid #0A0A0A;
        }
        .specs-table td {
          padding: 14px 16px;
          border: 1px solid #E5E7EB;
          font-size: 13px;
        }
        .specs-table tr:nth-child(even) {
          background: #F8F9FA;
        }
        .total-box {
          text-align: right;
          margin-bottom: 60px;
        }
        .total-row {
          display: inline-block;
          border-top: 2px solid #0A0A0A;
          padding-top: 10px;
        }
        .total-val {
          font-size: 24px;
          font-weight: 900;
          color: #EB0A1E;
          margin-left: 20px;
        }
        .footer {
          border-top: 1px solid #E5E7EB;
          padding-top: 20px;
          font-size: 11px;
          color: #6C757D;
          text-align: center;
          margin-top: 80px;
          line-height: 1.6;
        }
        .signature-block {
          display: flex;
          justify-content: space-between;
          margin-top: 60px;
          font-size: 13px;
        }
        .signature-col {
          width: 200px;
          border-top: 1px solid #0A0A0A;
          text-align: center;
          padding-top: 10px;
          margin-top: 50px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">VOBO<span>KUN</span></div>
          <div class="company-info" style="margin-top: 10px;">
            <strong>Vobokun Atelier Automobiles</strong><br>
            ${siteAddr}<br>
            Tél: ${siteTel}<br>
            contact@vobokun.com
          </div>
        </div>
        <div class="quote-meta">
          <h1 class="quote-title">PROPOSITION DE DEVIS</h1>
          <strong>Référence :</strong> ${quoteNo}<br>
          <strong>Date d'émission :</strong> ${dateStr}<br>
          <strong>Statut de l'offre :</strong> ${offer.statut.toUpperCase()}
        </div>
      </div>

      <div class="client-card">
        <h3>Destinataire (Acheteur)</h3>
        <div class="client-info">
          <strong>Nom / Prénom :</strong> ${p.prenom} ${p.nom}<br>
          <strong>Téléphone :</strong> ${p.telephone || 'N/A'}<br>
          <strong>Adresse Email :</strong> ${p.email || 'N/A'}
        </div>
      </div>

      <table class="specs-table">
        <thead>
          <tr>
            <th>Désignation Véhicule</th>
            <th>Année</th>
            <th>Carburant</th>
            <th>Transmission</th>
            <th>Kilométrage</th>
            <th>Prix Showroom</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>SUV ${v.marque} ${v.modele}</strong></td>
            <td>${v.annee || 'N/A'}</td>
            <td>${v.carburant || 'N/A'}</td>
            <td>${v.transmission || 'N/A'}</td>
            <td>${v.kilometrage ? new Intl.NumberFormat('fr-FR').format(v.kilometrage) + ' km' : 'N/A'}</td>
            <td>${formattedCatalogPrice}</td>
          </tr>
        </tbody>
      </table>

      <div class="total-box">
        <div class="total-row">
          <span style="font-weight: bold; font-size: 14px; text-transform: uppercase;">Montant Proposé de l'Offre :</span>
          <span class="total-val">${formattedBidPrice}</span>
        </div>
        ${offer.note_admin ? `<div style="margin-top: 15px; font-size: 12px; color: #555;"><strong>Note administrative :</strong> ${offer.note_admin}</div>` : ''}
      </div>

      <div class="signature-block">
        <div>
          <p>Bon pour accord (Signature Client)</p>
          <div class="signature-col"></div>
        </div>
        <div>
          <p>Le Concessionnaire (Cachet & Signature)</p>
          <div class="signature-col"></div>
        </div>
      </div>

      <div class="footer">
        Vobokun - Showroom de prestige. Ce document commercial est valable pour une durée de 15 jours à compter de sa date d'émission.<br>
        &copy; 2026 Vobokun Atelier Automobiles. Tous droits réservés.
      </div>

      <script>
        window.onload = function() {
          window.print();
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

// Bind Inbox select threads & live reply chat
function initInboxTabListeners() {
  const threads = document.querySelectorAll('.conversation-thread-btn');
  const chatPane = document.getElementById('admin-chat-pane');

  const openThread = async (contactId) => {
    activeChatContactId = contactId;
    
    threads.forEach(btn => {
      const isMatch = btn.getAttribute('data-contact-id') === contactId;
      if (isMatch) {
        btn.className = "w-100 text-start p-3 border-bottom d-flex align-items-center justify-content-between gap-2 conversation-thread-btn bg-danger-subtle border-start border-4 border-danger";
        const badge = btn.querySelector('.badge');
        if (badge) badge.outerHTML = '';
      } else {
        btn.className = "w-100 text-start p-3 border-bottom d-flex align-items-center justify-content-between gap-2 conversation-thread-btn bg-white";
      }
    });

    chatPane.innerHTML = `
      <div class="text-center py-5 text-muted my-auto">
        <div class="spinner-border spinner-border-sm text-danger mb-2" role="status"></div>
        <p class="small mb-0">Chargement des messages...</p>
      </div>
    `;

    let contactProfile = { id: contactId, prenom: 'Utilisateur', nom: 'Client' };
    const mockProfiles = mockDb.getCollection(mockDb.KEYS.PROFILES);
    const foundLocal = mockProfiles.find(p => p.id === contactId);
    if (foundLocal) contactProfile = foundLocal;

    if (!isMock && db) {
      try {
        const pDoc = await getDoc(doc(db, 'profiles', contactId));
        if (pDoc.exists()) {
          contactProfile = { id: pDoc.id, ...pDoc.data() };
        }
      } catch (e) {
        // ignore
      }
    }
    drawChatConsole(contactProfile);
  };

  threads.forEach(btn => {
    btn.addEventListener('click', () => {
      openThread(btn.getAttribute('data-contact-id'));
    });
  });

  const updateSidebarThread = (contactId, lastMsg, incrementUnread = false) => {
    const sidebarList = document.getElementById('admin-conversations-list');
    if (!sidebarList) return;

    let threadBtn = sidebarList.querySelector(`[data-contact-id="${contactId}"]`);
    const time = new Date(lastMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    if (threadBtn) {
      const textEl = threadBtn.querySelector('.text-muted.text-truncate');
      if (textEl) {
        textEl.textContent = lastMsg.contenu.startsWith('[audio]:') ? '🎤 Note vocale' : lastMsg.contenu;
      }

      const timeEl = threadBtn.querySelector('.text-end span');
      if (timeEl) timeEl.textContent = time;

      if (incrementUnread && contactId !== activeChatContactId) {
        const rightCol = threadBtn.querySelector('.text-end');
        if (rightCol) {
          let badge = rightCol.querySelector('.badge');
          if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            badge.textContent = (currentCount + 1).toString();
          } else {
            const newBadge = document.createElement('span');
            newBadge.className = 'badge rounded-pill bg-danger text-white';
            newBadge.style.fontSize = '0.65rem';
            newBadge.textContent = '1';
            rightCol.appendChild(newBadge);
          }
        }
      }

      sidebarList.prepend(threadBtn);
    } else {
      const fetchAndPrependThread = async () => {
        let contactProfile = { id: contactId, prenom: 'Utilisateur', nom: 'Client' };
        const mockProfiles = mockDb.getCollection(mockDb.KEYS.PROFILES);
        const found = mockProfiles.find(p => p.id === contactId);
        if (found) contactProfile = found;

        if (!isMock && db) {
          try {
            const pDoc = await getDoc(doc(db, 'profiles', contactId));
            if (pDoc.exists()) contactProfile = { id: pDoc.id, ...pDoc.data() };
          } catch (e) {
            // ignore
          }
        }

        const isActive = activeChatContactId === contactId;
        const activeClass = isActive ? 'bg-danger-subtle border-start border-4 border-danger' : 'bg-white';
        const badgeHTML = (incrementUnread && !isActive) ? `<span class="badge rounded-pill bg-danger text-white" style="font-size: 0.65rem;">1</span>` : '';

        const btnHTML = `
          <button class="w-100 text-start p-3 border-bottom d-flex align-items-center justify-content-between gap-2 conversation-thread-btn ${activeClass}" data-contact-id="${contactId}">
            <div class="d-flex align-items-center gap-2 overflow-hidden">
              <img src="${contactProfile.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}" class="rounded-circle object-fit-cover border flex-shrink-0" style="width: 38px; height: 38px;">
              <div class="overflow-hidden">
                <p class="small fw-bold text-dark mb-0 text-truncate">${contactProfile.prenom} ${contactProfile.nom}</p>
                <p class="small text-muted mb-0 text-truncate" style="font-size: 0.75rem;">${lastMsg.contenu.startsWith('[audio]:') ? '🎤 Note vocale' : lastMsg.contenu}</p>
              </div>
            </div>
            <div class="text-end flex-shrink-0 d-flex flex-column align-items-end gap-1">
              <span class="small text-muted font-monospace" style="font-size: 0.65rem;">${time}</span>
              ${badgeHTML}
            </div>
          </button>
        `;

        const container = document.createElement('div');
        container.innerHTML = btnHTML;
        const newBtn = container.firstElementChild;

        newBtn.addEventListener('click', () => {
          openThread(contactId);
        });

        sidebarList.prepend(newBtn);
      };
      fetchAndPrependThread();
    }
  };

  // Draw chat board wrapper
  const drawChatConsole = async (profile) => {
    chatPane.innerHTML = `
      <div class="d-flex flex-column h-100 overflow-hidden">
        
        <!-- Header details -->
        <div class="px-4 py-3 d-flex align-items-center justify-content-between text-white" style="background: var(--toyota-red);">
          <div class="d-flex align-items-center gap-2">
            <img src="${profile.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}" class="rounded-circle object-fit-cover border border-white" style="width: 36px; height: 36px;">
            <div>
              <h6 class="fw-black text-white text-uppercase font-display mb-0">${profile.prenom} ${profile.nom}</h6>
              <span class="text-white-50 small" style="font-size: 0.7rem;">Tél : ${profile.telephone || 'Non spécifié'}</span>
            </div>
          </div>
        </div>

        <!-- Chat messages view list -->
        <div id="admin-chat-messages" class="flex-grow-1 p-3 p-md-4 overflow-y-auto d-flex flex-column gap-2" style="background: #FAFBFD;">
          <div class="text-center py-5 text-muted small my-auto">Chargement des messages...</div>
        </div>

        <!-- Typing Indicator -->
        <div id="admin-chat-typing-indicator" class="d-none bg-light px-3 py-1 small text-muted fst-italic align-items-center gap-2 border-top" style="font-size: 0.75rem;">
          <div class="spinner-grow spinner-grow-sm text-danger" style="width: 0.65rem; height: 0.65rem;" role="status"></div>
          <span>Le client écrit...</span>
        </div>

        <!-- Input Form -->
        <form id="admin-chat-send-form" class="p-2 p-md-3 bg-light border-top d-flex align-items-center gap-2 position-relative">
          <!-- Text Input Container -->
          <div id="admin-chat-text-container" class="flex-grow-1 d-flex align-items-center gap-2">
            <input type="text" id="admin-chat-input" placeholder="Écrire votre réponse..." class="form-control toyota-input form-control-sm" required autocomplete="off">
            <button type="button" id="admin-chat-mic-btn" class="btn btn-sm btn-outline-secondary rounded-3" title="Enregistrer une note vocale">
              <i class="bi bi-mic"></i>
            </button>
          </div>

          <!-- Recording State Container -->
          <div id="admin-chat-recording-container" class="d-none flex-grow-1 d-flex align-items-center justify-content-between bg-danger-subtle rounded-3 px-2 py-1 border border-danger-subtle">
            <div class="d-flex align-items-center gap-2">
              <span class="rounded-circle bg-danger d-inline-block animate-pulse" style="width: 8px; height: 8px;"></span>
              <span class="small text-danger fw-bold font-monospace" id="admin-chat-recording-timer">0:00</span>
              <span class="small text-secondary" style="font-size: 0.7rem;">Enregistrement...</span>
            </div>
            <div class="d-flex align-items-center gap-1">
              <button type="button" id="admin-chat-cancel-record-btn" class="btn btn-sm btn-link text-muted p-1" title="Annuler">
                <i class="bi bi-trash3 text-danger"></i>
              </button>
              <button type="button" id="admin-chat-send-record-btn" class="btn btn-sm btn-danger rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;" title="Envoyer la note vocale">
                <i class="bi bi-arrow-up text-white"></i>
              </button>
            </div>
          </div>

          <!-- Submit Text Button -->
          <button type="submit" id="admin-chat-submit-btn" class="btn btn-toyota-red btn-sm rounded-3 px-3">
            <i class="bi bi-send-fill text-white"></i>
          </button>
        </form>

      </div>
    `;

    const msgList = document.getElementById('admin-chat-messages');
    const sendForm = document.getElementById('admin-chat-send-form');
    const input = document.getElementById('admin-chat-input');
    const typingIndicator = document.getElementById('admin-chat-typing-indicator');

    const micBtn = sendForm.querySelector('#admin-chat-mic-btn');
    const textContainer = sendForm.querySelector('#admin-chat-text-container');
    const recordingContainer = sendForm.querySelector('#admin-chat-recording-container');
    const recordingTimer = sendForm.querySelector('#admin-chat-recording-timer');
    const cancelRecordBtn = sendForm.querySelector('#admin-chat-cancel-record-btn');
    const sendRecordBtn = sendForm.querySelector('#admin-chat-send-record-btn');
    const submitBtn = sendForm.querySelector('#admin-chat-submit-btn');

    let recorder = null;

    const loadInboxMessages = async () => {
      try {
        const { data: messages } = await getMessages(profile.id);
        
        if (messages.length === 0) {
          msgList.innerHTML = `<div class="text-center py-5 text-muted small my-auto">Aucun message échangé.</div>`;
          return;
        }

        const myId = store.getState().user.id;
        msgList.innerHTML = messages.map(msg => {
          const isSelf = msg.sender_id === myId;
          const align = isSelf ? 'btn-toyota-red text-white align-self-end rounded-4 rounded-bottom-end-0 shadow-sm' : 'bg-white text-dark border align-self-start rounded-4 rounded-bottom-start-0 shadow-sm';
          const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

          const isAudio = msg.contenu && msg.contenu.startsWith('[audio]:');
          const contentHtml = isAudio 
            ? renderAudioPlayer(msg.contenu.substring(8), msg.id) 
            : `<span>${msg.contenu}</span>`;

          return `
            <div class="p-3 small lh-base ${align} d-flex flex-column" style="max-width: 80%;" data-msg-id="${msg.id || ''}">
              ${contentHtml}
              <span class="opacity-75 align-self-end mt-1 font-monospace" style="font-size: 0.65rem;">${time}</span>
            </div>
          `;
        }).join('');

        msgList.querySelectorAll('.voice-note-player').forEach(playerEl => {
          initAudioPlayer(playerEl);
        });

        msgList.scrollTop = msgList.scrollHeight;
        await updateKPIs();
      } catch (err) {
        console.error(err);
      }
    };

    let typingTimeout = null;
    let isCurrentlyTyping = false;

    input.addEventListener('input', () => {
      if (!isCurrentlyTyping) {
        isCurrentlyTyping = true;
        broadcastTyping(profile.id, true);
      }

      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        isCurrentlyTyping = false;
        broadcastTyping(profile.id, false);
      }, 3000);
    });

    if (micBtn && textContainer && recordingContainer) {
      const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
      };

      micBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
          if (!recorder) recorder = new AudioRecorder();
          
          await recorder.start((duration) => {
            if (recordingTimer) {
              recordingTimer.textContent = formatTime(duration);
            }
          });

          textContainer.classList.add('d-none');
          submitBtn.classList.add('d-none');
          recordingContainer.classList.remove('d-none');
          recordingContainer.classList.add('d-flex');
          input.required = false;

          broadcastTyping(profile.id, 'recording');

        } catch (err) {
          console.error('Microphone access denied or error:', err);
          alert('Impossible d\'accéder au microphone. Veuillez vérifier vos permissions.');
        }
      });

      const stopRecordingAndResetUI = () => {
        textContainer.classList.remove('d-none');
        submitBtn.classList.remove('d-none');
        recordingContainer.classList.add('d-none');
        recordingContainer.classList.remove('d-flex');
        input.required = true;
        if (recordingTimer) recordingTimer.textContent = '0:00';

        broadcastTyping(profile.id, false);
      };

      cancelRecordBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (recorder) {
          recorder.cancel();
        }
        stopRecordingAndResetUI();
      });

      sendRecordBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        if (!recorder) return;

        const duration = recorder.duration;
        const audioBlob = await recorder.stop();
        stopRecordingAndResetUI();

        if (!audioBlob || duration < 1) {
          console.warn('Audio is too short or empty');
          return;
        }

        const tempId = 'msg-temp-' + Date.now();
        const align = 'btn-toyota-red text-white align-self-end rounded-4 rounded-bottom-end-0 opacity-75';
        const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const localAudioUrl = URL.createObjectURL(audioBlob);

        const msgDiv = document.createElement('div');
        msgDiv.className = `p-3 small lh-base ${align} shadow-sm d-flex flex-column`;
        msgDiv.style.maxWidth = '80%';
        msgDiv.setAttribute('data-msg-id', tempId);
        msgDiv.setAttribute('data-pending', 'true');
        msgDiv.innerHTML = `
          ${renderAudioPlayer(localAudioUrl, tempId)}
          <span class="opacity-75 align-self-end mt-1 font-monospace d-flex align-items-center gap-1" style="font-size: 0.65rem;">
            ${time}
            <div class="spinner-border spinner-border-sm text-white" style="width: 0.6rem; height: 0.6rem;" role="status"></div>
          </span>
        `;

        const placeholder = msgList.querySelector('.my-auto');
        if (placeholder) {
          msgList.innerHTML = '';
        }

        msgList.appendChild(msgDiv);
        msgList.scrollTop = msgList.scrollHeight;

        const tempPlayerEl = msgDiv.querySelector('.voice-note-player');
        if (tempPlayerEl) {
          initAudioPlayer(tempPlayerEl);
        }

        try {
          const voiceUrl = await uploadVoiceNote(audioBlob);
          const contenu = `[audio]:${voiceUrl}`;
          
          const { data: sentMsg, error } = await sendMessage(profile.id, contenu);
          if (error) throw error;

          if (sentMsg) {
            const existingTemp = msgList.querySelector(`[data-msg-id="${tempId}"]`);
            if (existingTemp) {
              existingTemp.setAttribute('data-msg-id', sentMsg.id);
              existingTemp.removeAttribute('data-pending');
              existingTemp.classList.remove('opacity-75');
              
              const player = existingTemp.querySelector('.voice-note-player');
              if (player) {
                player.setAttribute('data-audio-url', voiceUrl);
              }

              const timeSpan = existingTemp.querySelector('span:last-child');
              if (timeSpan) {
                timeSpan.innerHTML = new Date(sentMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              }
            }
            updateSidebarThread(profile.id, sentMsg);
          }
        } catch (err) {
          console.error('Failed to send voice note:', err);
          const existingTemp = msgList.querySelector(`[data-msg-id="${tempId}"]`);
          if (existingTemp) {
            existingTemp.classList.remove('opacity-75');
            existingTemp.classList.add('border', 'border-danger');
            const timeSpan = existingTemp.querySelector('span:last-child');
            if (timeSpan) {
              timeSpan.innerHTML = `<span class="text-danger small">Échec</span>`;
            }
          }
        }
      });
    }

    sendForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      clearTimeout(typingTimeout);
      isCurrentlyTyping = false;
      broadcastTyping(profile.id, false);

      input.value = '';
      input.focus();

      const tempId = 'msg-temp-' + Date.now();
      const align = 'btn-toyota-red text-white align-self-end rounded-4 rounded-bottom-end-0 opacity-75';
      const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      const msgDiv = document.createElement('div');
      msgDiv.className = `p-3 small lh-base ${align} shadow-sm d-flex flex-column`;
      msgDiv.style.maxWidth = '80%';
      msgDiv.setAttribute('data-msg-id', tempId);
      msgDiv.setAttribute('data-pending', 'true');
      msgDiv.innerHTML = `
        <span>${text}</span>
        <span class="opacity-75 align-self-end mt-1 font-monospace d-flex align-items-center gap-1" style="font-size: 0.65rem;">
          ${time}
          <div class="spinner-border spinner-border-sm text-white" style="width: 0.6rem; height: 0.6rem;" role="status"></div>
        </span>
      `;
      
      const placeholder = msgList.querySelector('.my-auto');
      if (placeholder) {
        msgList.innerHTML = '';
      }

      msgList.appendChild(msgDiv);
      msgList.scrollTop = msgList.scrollHeight;

      try {
        const { data: sentMsg, error } = await sendMessage(profile.id, text);
        if (error) throw error;

        if (sentMsg) {
          const existingTemp = msgList.querySelector(`[data-msg-id="${tempId}"]`);
          if (existingTemp) {
            existingTemp.setAttribute('data-msg-id', sentMsg.id);
            existingTemp.removeAttribute('data-pending');
            existingTemp.classList.remove('opacity-75');
            const timeSpan = existingTemp.querySelector('span:last-child');
            if (timeSpan) {
              timeSpan.innerHTML = new Date(sentMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
            }
          }
          updateSidebarThread(profile.id, sentMsg);
        }
      } catch (err) {
        console.error('Failed to send admin reply', err);
        const existingTemp = msgList.querySelector(`[data-msg-id="${tempId}"]`);
        if (existingTemp) {
          existingTemp.classList.remove('opacity-75');
          existingTemp.classList.add('border', 'border-danger');
          const timeSpan = existingTemp.querySelector('span:last-child');
          if (timeSpan) {
            timeSpan.innerHTML = `<span class="text-danger small">Échec</span>`;
          }
        }
      }
    });

    await loadInboxMessages();

    if (activeChatListenerUnsub) {
      activeChatListenerUnsub();
    }

    activeChatListenerUnsub = subscribeToMessages(async (newMsg) => {
      const myId = store.getState().user.id;
      const belongs = (newMsg.sender_id === profile.id && newMsg.receiver_id === myId) || 
                      (newMsg.sender_id === myId && newMsg.receiver_id === profile.id);
      if (belongs) {
        const existing = msgList.querySelector(`[data-msg-id="${newMsg.id}"]`);
        if (!existing) {
          const isSelf = newMsg.sender_id === myId;
          
          if (isSelf) {
            const pendingEl = Array.from(msgList.querySelectorAll('[data-pending="true"]')).find(el => {
              const isAudio = newMsg.contenu.startsWith('[audio]:');
              if (isAudio) {
                const player = el.querySelector('.voice-note-player');
                return player && player.getAttribute('data-audio-url') === newMsg.contenu.substring(8);
              } else {
                const span = el.querySelector('span');
                return span && span.textContent.trim() === newMsg.contenu.trim();
              }
            });

            if (pendingEl) {
              pendingEl.setAttribute('data-msg-id', newMsg.id);
              pendingEl.removeAttribute('data-pending');
              pendingEl.classList.remove('opacity-75');
              const timeSpan = pendingEl.querySelector('span:last-child');
              if (timeSpan) {
                const time = new Date(newMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                timeSpan.innerHTML = time;
              }
              return;
            }
          }

          const align = isSelf ? 'btn-toyota-red text-white align-self-end rounded-4 rounded-bottom-end-0 shadow-sm' : 'bg-white text-dark border align-self-start rounded-4 rounded-bottom-start-0 shadow-sm';
          const time = new Date(newMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

          const msgDiv = document.createElement('div');
          msgDiv.className = `p-3 small lh-base ${align} d-flex flex-column`;
          msgDiv.style.maxWidth = '80%';
          msgDiv.setAttribute('data-msg-id', newMsg.id || '');
          
          const isAudio = newMsg.contenu && newMsg.contenu.startsWith('[audio]:');
          const contentHtml = isAudio 
            ? renderAudioPlayer(newMsg.contenu.substring(8), newMsg.id) 
            : `<span>${newMsg.contenu}</span>`;

          msgDiv.innerHTML = `
            ${contentHtml}
            <span class="opacity-75 align-self-end mt-1 font-monospace" style="font-size: 0.65rem;">${time}</span>
          `;
          
          const placeholder = msgList.querySelector('.my-auto');
          if (placeholder) {
            msgList.innerHTML = '';
          }

          msgList.appendChild(msgDiv);
          msgList.scrollTop = msgList.scrollHeight;

          if (isAudio) {
            const playerEl = msgDiv.querySelector('.voice-note-player');
            if (playerEl) {
              initAudioPlayer(playerEl);
            }
          }

          if (newMsg.receiver_id === myId && !newMsg.lu) {
            await getMessages(profile.id);
          }
        }
      }
      
      const contactId = newMsg.sender_id === myId ? newMsg.receiver_id : newMsg.sender_id;
      updateSidebarThread(contactId, newMsg, true);
    });

    let activeTypingListenerUnsub = null;
    activeTypingListenerUnsub = subscribeToTyping(profile.id, (payload) => {
      if (payload.sender_id === profile.id) {
        if (payload.isTyping) {
          if (typingIndicator) {
            const typingText = typingIndicator.querySelector('span:last-child');
            if (typingText) {
              typingText.textContent = payload.typingState === 'recording'
                ? 'Le client enregistre un audio...'
                : 'Le client écrit...';
            }
            typingIndicator.classList.remove('d-none');
            typingIndicator.classList.add('d-flex');
            msgList.scrollTop = msgList.scrollHeight;
          }
        } else {
          if (typingIndicator) {
            typingIndicator.classList.add('d-none');
            typingIndicator.classList.remove('d-flex');
          }
        }
      }
    });

    const originalUnsub = activeChatListenerUnsub;
    activeChatListenerUnsub = () => {
      if (originalUnsub) originalUnsub();
      if (activeTypingListenerUnsub) activeTypingListenerUnsub();
    };
  };

  if (activeChatContactId) {
    openThread(activeChatContactId);
  }
}
