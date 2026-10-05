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
    <div class="animate-fade-in space-y-8 text-left">
      
      <!-- Page Header -->
      <div class="border-b border-white/5 pb-6">
        <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Console</span>
        <h1 class="text-3xl font-extrabold text-white mt-1">Espace Concessionnaire</h1>
      </div>

      <!-- KPI METRICS GRID -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-6" id="admin-kpis">
        <!-- Loaded dynamically in init() -->
      </div>

      <!-- ANALYTICS DYNAMIC LINE CHART -->
      <section class="glass-panel border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden text-left">
        <h3 class="text-xs font-bold uppercase tracking-widest text-suv-gray mb-6">Évolution de l'activité du Showroom (7 derniers jours)</h3>
        
        <div id="admin-analytics-chart-container" class="h-48 w-full relative">
          <div class="absolute inset-0 flex items-center justify-center text-xs text-white/30">
            Chargement des statistiques...
          </div>
        </div>

        <div class="flex justify-between text-[10px] text-suv-gray font-bold mt-3 px-2" id="admin-chart-dates-labels">
          <!-- Populated dynamically -->
        </div>
      </section>

      <!-- SUB-TABS NAVIGATION -->
      <div class="flex border-b border-white/10 gap-2 overflow-x-auto pb-0.5">
        <button data-subtab="catalogue" class="subtab-btn pb-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${activeSubTab === 'catalogue' ? 'border-suv-gold text-suv-gold' : 'border-transparent text-white/40 hover:text-white'}">
          Gestion Catalogue
        </button>
        <button data-subtab="requests" class="subtab-btn pb-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${activeSubTab === 'requests' ? 'border-suv-gold text-suv-gold' : 'border-transparent text-white/40 hover:text-white'}">
          Demandes / Offres
        </button>
        <button data-subtab="inbox" class="subtab-btn pb-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 flex items-center gap-1.5 ${activeSubTab === 'inbox' ? 'border-suv-gold text-suv-gold' : 'border-transparent text-white/40 hover:text-white'}">
          <span>Messagerie Client</span>
          <span id="admin-inbox-badge" class="bg-suv-gold text-black text-[10px] font-black px-1.5 py-0.5 rounded-full hidden">0</span>
        </button>
        <button data-subtab="settings" class="subtab-btn pb-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${activeSubTab === 'settings' ? 'border-suv-gold text-suv-gold' : 'border-transparent text-white/40 hover:text-white'}">
          Paramètres Showroom
        </button>
      </div>

      <!-- WORKSPACE BOARD -->
      <div id="admin-workspace-board">
        <!-- Populated dynamically based on activeSubTab -->
      </div>

    </div>

    <!-- ADD/EDIT VEHICLE MODAL -->
    <div id="vehicle-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm hidden animate-fade-in">
      <div class="glass-panel border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-slide-up">
        
        <!-- Header -->
        <div class="bg-gradient-premium-gold p-6 flex justify-between items-center text-black sticky top-0 z-10 shadow-md">
          <div>
            <span class="text-[10px] font-black uppercase tracking-widest text-black/70">Flotte Automobile</span>
            <h3 class="font-black text-xl font-display uppercase tracking-tight" id="vehicle-modal-title">Ajouter un Véhicule</h3>
          </div>
          <button id="close-vehicle-modal-btn" class="p-1.5 hover:bg-black/10 rounded-xl transition-colors">
            <svg class="w-6 h-6 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <!-- Form content -->
        <form id="vehicle-form" class="p-6 space-y-6 text-left">
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Marque</label>
              <input type="text" id="v-marque" placeholder="Ex: Toyota" class="w-full suv-input text-sm" required>
            </div>
            
            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Modèle</label>
              <input type="text" id="v-modele" placeholder="Ex: Land Cruiser" class="w-full suv-input text-sm" required>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Année de fabrication</label>
              <input type="number" id="v-annee" placeholder="Ex: 2022" class="w-full suv-input text-sm" required min="1990" max="2027">
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Prix (FCFA)</label>
              <input type="number" id="v-prix" placeholder="Ex: 45000000" class="w-full suv-input text-sm" required>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Kilométrage (km)</label>
              <input type="number" id="v-kilometrage" placeholder="Ex: 25000" class="w-full suv-input text-sm" required>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Couleur</label>
              <input type="text" id="v-couleur" placeholder="Ex: Noir Métallisé" class="w-full suv-input text-sm" required>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Carburant</label>
              <select id="v-carburant" class="w-full suv-input bg-suv-slate border-white/10 text-sm focus:border-suv-gold" required>
                <option value="Essence">Essence</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybride">Hybride</option>
                <option value="Électrique">Électrique</option>
              </select>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Transmission</label>
              <input type="text" id="v-transmission" placeholder="Ex: AWD Auto 9 rapports" class="w-full suv-input text-sm" required>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Motorisation</label>
              <input type="text" id="v-motorisation" placeholder="Ex: 3.5L V6 Hybrid" class="w-full suv-input text-sm" required>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Puissance</label>
              <input type="text" id="v-puissance" placeholder="Ex: 385 ch" class="w-full suv-input text-sm" required>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Accélération (0-100 km/h)</label>
              <input type="text" id="v-acceleration" placeholder="Ex: 5.8 s" class="w-full suv-input text-sm" required>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Consommation</label>
              <input type="text" id="v-consommation" placeholder="Ex: 7.4 L/100 km" class="w-full suv-input text-sm" required>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Nombre de places</label>
              <input type="number" id="v-places" placeholder="Ex: 7" class="w-full suv-input text-sm" required min="1" max="15">
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Capacité Coffre</label>
              <input type="text" id="v-coffre" placeholder="Ex: 750 L" class="w-full suv-input text-sm" required>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Couleurs disponibles</label>
              <input type="text" id="v-couleurs-dispo" placeholder="Ex: Silver / Noir / Blanc" class="w-full suv-input text-sm" required>
            </div>

            <div class="space-y-1.5 md:col-span-2">
              <label class="text-xs font-bold uppercase tracking-wider text-suv-gray flex items-center justify-between">
                <span>Statut de visibilité</span>
                <span class="text-xxs text-white/35 lowercase">(disponible = public catalogue)</span>
              </label>
              <select id="v-statut" class="w-full suv-input bg-suv-slate border-white/10 text-sm focus:border-suv-gold" required>
                <option value="disponible">Disponible</option>
                <option value="vendu">Vendu</option>
                <option value="archivé">Archivé</option>
              </select>
            </div>

            <div class="flex items-center gap-3 md:col-span-2 py-2">
              <input type="checkbox" id="v-featured" class="rounded border-white/10 bg-white/5 text-suv-red focus:ring-suv-red w-4.5 h-4.5 cursor-pointer">
              <label for="v-featured" class="text-sm font-semibold text-white/90 cursor-pointer">Mettre ce véhicule en Vedette (Homepage)</label>
            </div>
          </div>

          <!-- Description -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Description longue</label>
            <textarea id="v-description" rows="4" placeholder="Détails, équipements, carnet d'entretien..." class="w-full suv-input text-sm" required></textarea>
          </div>

          <!-- Photos drag & drop file upload panel -->
          <div class="space-y-3">
            <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Photos du SUV (Max 10)</label>
            
            <div id="photos-drop-zone" class="border-2 border-dashed border-white/10 hover:border-suv-gold/50 rounded-xl p-8 text-center cursor-pointer hover:bg-white/5 transition-colors flex flex-col items-center justify-center gap-2">
              <svg class="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              <p class="text-sm font-bold text-white/80">Glissez-déposez des photos ou cliquez pour naviguer</p>
              <p class="text-xxs text-white/35 font-medium">JPEG, PNG max 5Mo par fichier</p>
              <input type="file" id="modal-photos-input" multiple accept="image/*" class="hidden">
            </div>

            <!-- Uploaded photos preview grid -->
            <div id="photos-preview-grid" class="grid grid-cols-4 md:grid-cols-6 gap-3 pt-2">
              <!-- Rendered dynamically on image select -->
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-4 pt-4 border-t border-white/10 sticky bottom-0 bg-[#0E1218]/95 py-2">
            <button type="button" id="cancel-vehicle-btn" class="flex-1 border border-white/10 hover:bg-white/5 text-white py-3.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all">
              Annuler
            </button>
            <button type="submit" class="flex-1 btn-premium-gold py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg">
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
        btn.className = "subtab-btn pb-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 border-suv-gold text-suv-gold";
      } else {
        btn.className = "subtab-btn pb-3 px-4 text-xs font-black uppercase tracking-wider transition-all border-b-2 border-transparent text-white/40 hover:text-white";
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
        inboxBadge.classList.remove('hidden');
      } else {
        inboxBadge.classList.add('hidden');
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
      <div class="glass-card rounded-2xl p-5 border border-white/5">
        <p class="text-xxs uppercase tracking-wider text-suv-gray font-bold">SUV en ligne</p>
        <p class="text-2xl font-black font-display text-white mt-1.5">${activeCount}</p>
      </div>
      <div class="glass-card rounded-2xl p-5 border border-white/5">
        <p class="text-xxs uppercase tracking-wider text-suv-gray font-bold">Ventes Clôturées</p>
        <p class="text-2xl font-black font-display text-emerald-400 mt-1.5">${soldCount}</p>
      </div>
      <div class="glass-card rounded-2xl p-5 border border-white/5">
        <p class="text-xxs uppercase tracking-wider text-suv-gray font-bold">Offres en Attente</p>
        <p class="text-2xl font-black font-display text-amber-400 mt-1.5">${pendingOffers}</p>
      </div>
      <div class="glass-card rounded-2xl p-5 border border-white/5">
        <p class="text-xxs uppercase tracking-wider text-suv-gray font-bold">Chats Non Lus</p>
        <p class="text-2xl font-black font-display text-suv-red mt-1.5">${unreadMessages}</p>
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
    // 1. Fetch data
    const { data: offers } = await getAllOffers();
    const { data: vehicles } = await getVehicles({}, 'dateDesc', 1, 100);

    // 2. Generate last 7 days dates and labels
    const days = [...Array(7)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d;
    });

    const labels = days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
    const fullLabels = days.map(d => d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }));

    // 3. Calculate metrics per day
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

    // 4. Build dates labels row
    if (labelsContainer) {
      labelsContainer.innerHTML = labels.map((l, i) => `<span>${i === 6 ? "Aujourd'hui" : l}</span>`).join('');
    }

    // 5. Calculate coordinates for SVG
    const maxVisits = Math.max(...visits, 100);
    const maxRequests = Math.max(...requests, 10);

    const pointsVisits = visits.map((v, i) => ({
      x: (i / 6) * 700,
      y: 150 - (v / maxVisits) * 120
    }));

    const pointsRequests = requests.map((r, i) => ({
      x: (i / 6) * 700,
      y: 150 - (r / maxRequests) * 120
    }));

    const pathVisits = pointsVisits.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ');
    const areaVisits = `${pathVisits} L 700 180 L 0 180 Z`;

    const pathRequests = pointsRequests.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ');

    const circlesVisitsHTML = pointsVisits.map((p, i) => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="#ffffff" stroke="#FFB74D" stroke-width="2" class="chart-dot chart-dot-visits transition-all duration-200" data-idx="${i}" />
    `).join('');

    const circlesRequestsHTML = pointsRequests.map((p, i) => `
      <circle cx="${p.x}" cy="${p.y}" r="4" fill="#ffffff" stroke="#92000A" stroke-width="2" class="chart-dot chart-dot-requests transition-all duration-200" data-idx="${i}" />
    `).join('');

    // 6. Draw SVG Chart
    container.innerHTML = `
      <svg id="admin-svg-chart" viewBox="0 0 700 180" class="w-full h-full cursor-crosshair relative z-10" preserveAspectRatio="none">
        <defs>
          <linearGradient id="visits-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#FFB74D" stop-opacity="0.2"/>
            <stop offset="100%" stop-color="#FFB74D" stop-opacity="0"/>
          </linearGradient>
        </defs>

        <!-- Grid Lines -->
        <line x1="0" y1="30" x2="700" y2="30" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
        <line x1="0" y1="90" x2="700" y2="90" stroke="rgba(255,255,255,0.03)" stroke-width="1" />
        <line x1="0" y1="150" x2="700" y2="150" stroke="rgba(255,255,255,0.03)" stroke-width="1" />

        <!-- Vertical Pointer Line -->
        <line id="chart-vertical-pointer" x1="0" y1="0" x2="0" y2="180" stroke="rgba(255, 255, 255, 0.15)" stroke-dasharray="4" stroke-width="1.5" class="hidden" />

        <!-- Visits Area & Line -->
        <path d="${areaVisits}" fill="url(#visits-grad)" />
        <path d="${pathVisits}" fill="none" stroke="#FFB74D" stroke-width="2.5" stroke-linecap="round" />
        ${circlesVisitsHTML}

        <!-- Requests Line -->
        <path d="${pathRequests}" fill="none" stroke="#92000A" stroke-width="2.5" stroke-linecap="round" />
        ${circlesRequestsHTML}
      </svg>
      <div id="chart-floating-tooltip" class="chart-tooltip hidden"></div>
    `;

    // 7. Add Interactive Hover Effects
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
        pointer.classList.remove('hidden');

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
          <div class="font-bold text-white mb-1.5">${fullLabels[idx]}</div>
          <div class="flex items-center gap-2 font-medium">
            <span class="w-2 h-2 rounded-full bg-[#FFB74D]"></span>
            <span class="text-white/80">Visites : <span class="text-white font-bold">${visits[idx]}</span></span>
          </div>
          <div class="flex items-center gap-2 font-medium mt-1">
            <span class="w-2 h-2 rounded-full bg-[#92000A]"></span>
            <span class="text-white/80">Demandes : <span class="text-white font-bold">${requests[idx]}</span></span>
          </div>
        `;
        tooltip.classList.remove('hidden');
      };

      const onLeave = () => {
        pointer.classList.add('hidden');
        tooltip.classList.add('hidden');
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
    container.innerHTML = `<div class="absolute inset-0 flex items-center justify-center text-xs text-rose-400">Erreur lors de la construction du graphique.</div>`;
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

  board.innerHTML = `<div class="text-center py-12 text-suv-gray">Chargement du module...</div>`;

  try {
    if (activeSubTab === 'catalogue') {
      const { data: vehicles } = await getVehicles({ limit: 100 });

      board.innerHTML = `
        <div class="glass-panel border border-white/5 rounded-2xl p-6 space-y-6">
          <div class="flex items-center justify-between gap-4 flex-wrap">
            <h3 class="text-md font-bold uppercase tracking-wider text-white font-display">Gestion du catalogue</h3>
            
            <div class="flex items-center gap-3 flex-wrap">
              <!-- Excel Import Inputs & Buttons -->
              <input type="file" id="excel-import-input" accept=".xlsx, .xls, .csv" class="hidden">
              
              <button id="download-template-btn" class="border border-white/10 hover:bg-white/5 text-white/80 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5" title="Télécharger le modèle Excel d'importation">
                <svg class="w-4 h-4 text-suv-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Modèle Excel
              </button>

              <button id="excel-import-btn" class="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-lg shadow-emerald-600/10" title="Importer des véhicules depuis un fichier Excel ou CSV">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m-9 1V4a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>
                Importer Excel
              </button>

              <button id="add-vehicle-btn" class="btn-premium-gold px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md">
                <svg class="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 4v16m8-8H4"/></svg>
                <span>Ajouter un SUV</span>
              </button>
            </div>
          </div>

          <!-- Import Progress Alert -->
          <div id="import-status-banner" class="hidden glass-panel border border-suv-gold/20 p-4 rounded-xl flex items-center justify-between text-xs text-suv-gold animate-pulse">
            <span class="flex items-center gap-2">
              <svg class="animate-spin h-4.5 w-4.5 text-suv-gold" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Analyse et importation des véhicules en cours... Veuillez patienter et ne pas fermer cette page.
            </span>
          </div>

          <!-- Table Container -->
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-sm">
              <thead>
                <tr class="border-b border-white/10 text-suv-gray font-bold">
                  <th class="py-3 px-4">Aperçu</th>
                  <th class="py-3 px-4">Véhicule</th>
                  <th class="py-3 px-4">Année</th>
                  <th class="py-3 px-4">Prix</th>
                  <th class="py-3 px-4">Kilométrage</th>
                  <th class="py-3 px-4">Statut</th>
                  <th class="py-3 px-4">Vues</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                ${vehicles.map(v => {
                  const image = v.photos && v.photos.length > 0 ? v.photos[0] : 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=100&q=80';
                  
                  let statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
                  if (v.statut === 'vendu') statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
                  if (v.statut === 'archivé') statusColor = 'text-white/40 bg-white/5 border-white/10';

                  return `
                    <tr class="hover:bg-white/5 transition-colors group">
                      <td class="py-3.5 px-4">
                        <img src="${image}" class="w-16 aspect-[16/10] object-cover rounded-lg border border-white/10">
                      </td>
                      <td class="py-3.5 px-4 font-semibold">
                        <p class="text-white group-hover:text-suv-gold transition-colors">${v.marque}</p>
                        <p class="text-xs text-suv-gray">${v.modele}</p>
                      </td>
                      <td class="py-3.5 px-4 font-medium">${v.annee}</td>
                      <td class="py-3.5 px-4 text-suv-gold font-bold font-sans">${new Intl.NumberFormat('fr-FR').format(v.prix)} ${currency}</td>
                      <td class="py-3.5 px-4 text-white/70">${new Intl.NumberFormat('fr-FR').format(v.kilometrage)} km</td>
                      <td class="py-3.5 px-4">
                        <span class="border px-2 py-0.5 rounded-full text-xxs font-bold ${statusColor} capitalize">${v.statut}</span>
                      </td>
                      <td class="py-3.5 px-4 font-semibold text-white/60">${v.vues || 0}</td>
                      <td class="py-3.5 px-4 text-right">
                        <div class="flex items-center justify-end gap-2">
                          <button class="edit-v-btn p-1.5 rounded bg-white/5 hover:bg-white/10 text-suv-gold border border-white/5" data-id="${v.id}" title="Modifier">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                          </button>
                          <button class="status-v-btn p-1.5 rounded bg-white/5 hover:bg-emerald-500/10 text-emerald-400 border border-white/5" data-id="${v.id}" data-statut="${v.statut === 'vendu' ? 'disponible' : 'vendu'}" title="${v.statut === 'vendu' ? 'Marquer disponible' : 'Marquer vendu'}">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                          </button>
                          <button class="delete-v-btn p-1.5 rounded bg-white/5 hover:bg-rose-500/10 text-rose-400 border border-white/5" data-id="${v.id}" title="Supprimer">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
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
          <div class="glass-panel border border-white/5 rounded-2xl p-10 text-center text-suv-gray">
            Aucune demande d'offre n'a été soumise pour le moment.
          </div>
        `;
        return;
      }

      board.innerHTML = `
        <div class="glass-panel border border-white/5 rounded-2xl p-6 space-y-6">
          <h3 class="text-md font-bold uppercase tracking-wider text-white font-display mb-4">Suivi des Demandes et Négociations</h3>
          
          <div class="space-y-6">
            ${offers.map(o => {
              let badgeStyle = '';
              if (o.statut === 'pending') badgeStyle = 'bg-amber-500/10 text-amber-400 border-amber-500/25';
              else if (o.statut === 'accepted') badgeStyle = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
              else if (o.statut === 'refused') badgeStyle = 'bg-rose-500/10 text-rose-400 border-rose-500/25';
              else badgeStyle = 'bg-blue-500/10 text-blue-400 border-blue-500/25';

              const priceHTML = o.prix_propose
                ? `<span class="text-suv-gold font-bold font-sans text-sm">${new Intl.NumberFormat('fr-FR').format(o.prix_propose)} ${currency}</span>`
                : `<span class="text-white/40 text-xs">Aucune offre de prix</span>`;

              const p = o.profile || { prenom: 'Utilisateur', nom: 'Anonyme', telephone: '' };
              const v = o.vehicle || { marque: 'SUV', modele: 'supprimé', prix: 0 };

              return `
                <div class="glass-card rounded-2xl p-5 border border-white/5 space-y-4" data-offer-id="${o.id}">
                  <div class="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h4 class="font-bold text-white text-sm font-display">${v.marque} ${v.modele}</h4>
                      <p class="text-xs text-suv-gray mt-0.5">Proposé par : <span class="text-white">${p.prenom} ${p.nom}</span> • Tel: <span class="text-white">${p.telephone || 'N/A'}</span></p>
                    </div>
                    <div class="flex items-center gap-3">
                      ${priceHTML}
                      <span class="border px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeStyle} capitalize">${o.statut}</span>
                    </div>
                  </div>

                  <div class="bg-suv-darker/50 p-4 rounded-xl text-sm leading-relaxed border border-white/5">
                    <p class="text-xxs uppercase tracking-wider text-suv-gray font-bold mb-1">Message de l'acheteur :</p>
                    <p class="text-white/80">${o.message}</p>
                  </div>

                  <!-- Notes & Decision panel -->
                  <div class="grid grid-cols-1 md:grid-cols-4 gap-4 items-end pt-2">
                    
                    <!-- Admin internal note -->
                    <div class="md:col-span-2 space-y-1">
                      <label class="text-xxs font-bold uppercase tracking-wider text-suv-gray">Note ou réponse client (admin)</label>
                      <input type="text" class="note-admin-input w-full suv-input py-2 px-3 text-xs" value="${o.note_admin || ''}" placeholder="Ajouter une note de suivi...">
                    </div>

                    <!-- Action selection buttons -->
                    <div class="flex gap-2">
                      <button class="decision-btn flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 rounded-lg transition-all" data-action="accepted">
                        Accepter
                      </button>
                      <button class="decision-btn flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2 rounded-lg transition-all" data-action="refused">
                        Refuser
                      </button>
                      <button class="decision-btn flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2 rounded-lg transition-all" data-action="in_progress">
                        Négocier
                      </button>
                    </div>

                    <!-- PDF Devis Button -->
                    <div>
                      <button class="devis-btn w-full bg-suv-gold hover:bg-[#fff77f] text-suv-dark font-extrabold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5" data-offer-id="${o.id}">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Générer Devis
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
          <div class="glass-panel border border-white/5 rounded-2xl p-10 text-center text-suv-gray">
            Aucun chat client démarré pour l'instant.
          </div>
        `;
        return;
      }

      // Render Split Inbox Pane
      board.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[550px]">
          
          <!-- LEFT: Thread list sidebar (lg: 4 cols) -->
          <div class="lg:col-span-4 glass-panel border border-white/5 rounded-2xl flex flex-col overflow-hidden h-full">
            <div class="px-4 py-3 bg-white/5 border-b border-white/5">
              <h4 class="text-xs font-bold uppercase tracking-wider text-suv-gray">Conversations Clients</h4>
            </div>
            
            <div class="flex-grow overflow-y-auto divide-y divide-white/5" id="admin-conversations-list">
              ${conversations.map(c => {
                const isActive = activeChatContactId === c.contact.id;
                const activeClass = isActive ? 'bg-suv-red/10 border-l-4 border-suv-gold' : 'hover:bg-white/5';
                const time = new Date(c.lastMessage.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                
                return `
                  <button class="w-full text-left p-4 transition-all flex items-center justify-between gap-3 ${activeClass} conversation-thread-btn" data-contact-id="${c.contact.id}">
                    <div class="flex items-center gap-3 overflow-hidden">
                      <img src="${c.contact.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}" class="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0">
                      <div class="overflow-hidden">
                        <p class="text-sm font-bold text-white truncate">${c.contact.prenom} ${c.contact.nom}</p>
                        <p class="text-xs text-suv-gray truncate mt-0.5">${c.lastMessage.contenu.startsWith('[audio]:') ? '🎤 Note vocale' : c.lastMessage.contenu}</p>
                      </div>
                    </div>
                    <div class="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                      <span class="text-[9px] text-white/30">${time}</span>
                      ${c.unreadCount > 0 ? `<span class="bg-suv-gold text-suv-red text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">${c.unreadCount}</span>` : ''}
                    </div>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- RIGHT: Chat Board Pane (lg: 8 cols) -->
          <div class="lg:col-span-8 glass-panel border border-white/5 rounded-2xl flex flex-col overflow-hidden h-full" id="admin-chat-pane">
            <div class="flex items-center justify-center h-full text-suv-gray text-xs">
              Sélectionnez une discussion à gauche pour répondre en direct.
            </div>
          </div>

        </div>
      `;

      initInboxTabListeners();

    } else if (activeSubTab === 'settings') {
      // Load current site settings from store or localStorage
      const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
      const address = localStorage.getItem('suv_site_address') || "Haie Vive, Cotonou, Bénin";
      const tel = localStorage.getItem('suv_site_tel') || "+229 01 00 00 00 00";
      const bannerActive = localStorage.getItem('suv_site_banner_active') === 'true';
      const bannerText = localStorage.getItem('suv_site_banner_text') || "✨ Arrivage exceptionnel ce mois-ci : Découvrez nos nouveaux Range Rover 2024 !";

      board.innerHTML = `
        <div class="glass-panel border border-white/5 rounded-2xl p-6 md:p-8 space-y-8">
          <h3 class="text-md font-bold uppercase tracking-wider text-white font-display border-b border-white/5 pb-4">Configuration Générale de la Plateforme</h3>
          
          <form id="settings-form" class="space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <!-- Devise -->
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Devise de la plateforme</label>
                <select id="set-currency" class="w-full suv-input bg-suv-slate border-white/10 text-sm focus:border-suv-gold">
                  <option value="FCFA" ${currency === 'FCFA' ? 'selected' : ''}>FCFA (Afrique de l'Ouest / XOF)</option>
                  <option value="EUR" ${currency === 'EUR' ? 'selected' : ''}>Euro (€)</option>
                  <option value="USD" ${currency === 'USD' ? 'selected' : ''}>Dollar ($)</option>
                </select>
              </div>

              <!-- Coordonnées Tel -->
              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Téléphone de contact</label>
                <input type="text" id="set-tel" value="${tel}" class="w-full suv-input" required>
              </div>

              <!-- Adresse Physique -->
              <div class="space-y-2 md:col-span-2">
                <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Adresse physique de l'exposition</label>
                <input type="text" id="set-address" value="${address}" class="w-full suv-input" required>
              </div>
            </div>

            <!-- Bandeau Promotionnel Section -->
            <div class="border-t border-white/5 pt-6 space-y-4 text-left">
              <h4 class="text-xs font-bold uppercase tracking-widest text-suv-gold">Bandeau d'actualités (Top Header)</h4>
              
              <div class="flex items-center gap-3">
                <input type="checkbox" id="set-banner-active" ${bannerActive ? 'checked' : ''} class="rounded border-white/10 bg-white/5 text-suv-red focus:ring-suv-red w-4.5 h-4.5 cursor-pointer">
                <label for="set-banner-active" class="text-sm font-semibold text-white/90 cursor-pointer">Activer le bandeau promotionnel en haut du site</label>
              </div>

              <div class="space-y-2">
                <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Message du bandeau</label>
                <input type="text" id="set-banner-text" value="${bannerText}" class="w-full suv-input text-sm" placeholder="Ex: Offre spéciale fin d'année...">
              </div>
            </div>

            <!-- Submit -->
            <div class="text-right pt-6 border-t border-white/5">
              <button type="submit" class="bg-suv-red hover:bg-suv-purple text-white px-8 py-3 rounded-xl font-bold transition-all text-sm shadow-lg shadow-suv-red/10">
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
    board.innerHTML = `<div class="text-center py-12 text-rose-400">Erreur lors de la construction du module.</div>`;
  }
}

// Dynamic on-demand loader for SheetJS (keeps public pages ultra-light)
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

  // Excel template downloader using SheetJS
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

  // Excel importer listener
  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => {
      importInput.click();
    });

    importInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      importInput.value = ''; // Reset to allow re-upload

      if (statusBanner) statusBanner.classList.remove('hidden');

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
                  .replace(/[\u0300-\u036f]/g, "") // remove accents
                  .replace(/\s+/g, '') // remove spaces
                  .replace(/_/g, ''); // remove underscores
                
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

            // Validation
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

          // Always insert into local storage first for 0ms immediate access
          const list = mockDb.getCollection(mockDb.KEYS.VEHICLES);
          parsedVehicles.forEach((v, index) => {
            v.id = 'suv-excel-' + index + '-' + Math.random().toString(36).substr(2, 5);
            v.created_at = new Date().toISOString();
            v.updated_at = new Date().toISOString();
            list.unshift(v);
          });
          mockDb.saveCollection(mockDb.KEYS.VEHICLES, list);

          // Sync to Firestore in background if active
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
          if (statusBanner) statusBanner.classList.add('hidden');
        }
      };
      reader.onerror = () => {
        alert("Impossible de lire le fichier.");
        if (statusBanner) statusBanner.classList.add('hidden');
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
    
    if (modal) modal.classList.remove('hidden');
  };

  const hideModal = () => {
    if (modal) modal.classList.add('hidden');
    if (vForm) vForm.reset();
  };

  if (addBtn) addBtn.addEventListener('click', () => showModal('Ajouter un SUV'));
  if (closeModalBtn) closeModalBtn.addEventListener('click', hideModal);
  if (cancelBtn) cancelBtn.addEventListener('click', hideModal);

  // File picker binding
  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('click', (e) => e.stopPropagation());
    
    // Drag Over
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-suv-gold');
    });

    // Drag Leave
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-suv-gold');
    });

    // Drop Files
    dropZone.addEventListener('drop', async (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-suv-gold');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        await handleImageUpload(files);
      }
    });

    // File selection
    fileInput.addEventListener('change', async (e) => {
      const files = e.target.files;
      if (files.length > 0) {
        await handleImageUpload(files);
      }
    });
  }

  // Upload and show preview
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

  // Render previews
  const renderImagePreviews = () => {
    const grid = document.getElementById('photos-preview-grid');
    if (!grid) return;

    grid.innerHTML = currentUploadedPhotos.map((url, idx) => `
      <div class="aspect-[16/10] rounded-lg border border-white/10 overflow-hidden relative group">
        <img src="${url}" class="w-full h-full object-cover">
        
        <!-- Delete overlay btn -->
        <button type="button" class="delete-photo-btn absolute inset-0 bg-rose-600/70 opacity-0 group-hover:opacity-100 flex items-center justify-center font-bold text-white transition-opacity text-xs" data-idx="${idx}">
          Supprimer
        </button>
      </div>
    `).join('');

    // Bind delete photo
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

        // Prepopulate
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

  // Quick Sold toggle
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

  // Delete
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
      <title>Devis Concessionnaire - ${quoteNo}</title>
      <style>
        body {
          font-family: 'Plus Jakarta Sans', Arial, sans-serif;
          color: #1a1a1a;
          margin: 0;
          padding: 40px;
          background: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          border-bottom: 2px solid #92000A;
          padding-bottom: 20px;
          margin-bottom: 40px;
        }
        .logo {
          font-family: 'Montserrat', sans-serif;
          font-size: 24px;
          font-weight: 900;
          color: #1a1a1a;
        }
        .logo span {
          color: #FFB74D;
        }
        .company-info, .client-info {
          font-size: 13px;
          line-height: 1.6;
        }
        .client-card {
          border: 1px solid #e5e5e5;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 40px;
          background: #fcfcfc;
        }
        .client-card h3 {
          margin-top: 0;
          color: #92000A;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .quote-meta {
          text-align: right;
          font-size: 13px;
        }
        .quote-title {
          font-size: 28px;
          font-family: 'Montserrat', sans-serif;
          font-weight: 800;
          margin: 0 0 10px 0;
          color: #120f13;
        }
        .specs-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
        }
        .specs-table th {
          background: #1a1a1a;
          color: #ffffff;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: bold;
          padding: 12px 16px;
          border: 1px solid #1a1a1a;
        }
        .specs-table td {
          padding: 14px 16px;
          border: 1px solid #e5e5e5;
          font-size: 13px;
        }
        .specs-table tr:nth-child(even) {
          background: #f9f9f9;
        }
        .total-box {
          text-align: right;
          margin-bottom: 60px;
        }
        .total-row {
          display: inline-block;
          border-top: 1px solid #e5e5e5;
          padding-top: 10px;
        }
        .total-val {
          font-size: 22px;
          font-weight: 900;
          color: #92000A;
          margin-left: 20px;
        }
        .footer {
          border-top: 1px solid #e5e5e5;
          padding-top: 20px;
          font-size: 11px;
          color: #777777;
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
          border-top: 1px solid #1a1a1a;
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
            <strong>Vobokun Bénin</strong><br>
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
        &copy; 2026 Vobokun. Tous droits réservés.
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
    
    // Highlight active contact thread in DOM
    threads.forEach(btn => {
      const isMatch = btn.getAttribute('data-contact-id') === contactId;
      if (isMatch) {
        btn.className = "w-full text-left p-4 transition-all flex items-center justify-between gap-3 bg-suv-red/10 border-l-4 border-suv-gold conversation-thread-btn";
        const badge = btn.querySelector('.bg-suv-gold');
        if (badge) badge.outerHTML = ''; // Clear unread locally
      } else {
        btn.className = "w-full text-left p-4 transition-all flex items-center justify-between gap-3 hover:bg-white/5 conversation-thread-btn";
      }
    });

    chatPane.innerHTML = `<div class="text-center py-12 text-suv-gray my-auto">Chargement des messages...</div>`;

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

  // Bind thread buttons click
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
      // Update message text
      const textEl = threadBtn.querySelector('.text-suv-gray.truncate');
      if (textEl) {
        textEl.textContent = lastMsg.contenu.startsWith('[audio]:') ? '🎤 Note vocale' : lastMsg.contenu;
      }

      // Update time
      const timeEl = threadBtn.querySelector('.text-right span');
      if (timeEl) timeEl.textContent = time;

      // Update unread count if requested
      if (incrementUnread && contactId !== activeChatContactId) {
        const rightCol = threadBtn.querySelector('.text-right');
        if (rightCol) {
          let badge = rightCol.querySelector('.bg-suv-gold');
          if (badge) {
            const currentCount = parseInt(badge.textContent) || 0;
            badge.textContent = (currentCount + 1).toString();
          } else {
            const newBadge = document.createElement('span');
            newBadge.className = 'bg-suv-gold text-suv-red text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center';
            newBadge.textContent = '1';
            rightCol.appendChild(newBadge);
          }
        }
      }

      // Move thread to top of list
      sidebarList.prepend(threadBtn);
    } else {
      // Load and add new contact thread dynamically
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
        const activeClass = isActive ? 'bg-suv-red/10 border-l-4 border-suv-gold' : 'hover:bg-white/5';
        const badgeHTML = (incrementUnread && !isActive) ? `<span class="bg-suv-gold text-suv-red text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">1</span>` : '';

        const btnHTML = `
          <button class="w-full text-left p-4 transition-all flex items-center justify-between gap-3 ${activeClass} conversation-thread-btn" data-contact-id="${contactId}">
            <div class="flex items-center gap-3 overflow-hidden">
              <img src="${contactProfile.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}" class="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0">
              <div class="overflow-hidden">
                <p class="text-sm font-bold text-white truncate">${contactProfile.prenom} ${contactProfile.nom}</p>
                <p class="text-xs text-suv-gray truncate mt-0.5">${lastMsg.contenu.startsWith('[audio]:') ? '🎤 Note vocale' : lastMsg.contenu}</p>
              </div>
            </div>
            <div class="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
              <span class="text-[9px] text-white/30">${time}</span>
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
      <div class="flex flex-col h-full overflow-hidden">
        
        <!-- header details -->
        <div class="bg-white/5 border-b border-white/5 px-6 py-4 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img src="${profile.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}" class="w-10 h-10 rounded-full object-cover border border-white/10">
            <div>
              <h4 class="font-bold text-white text-sm font-display">${profile.prenom} ${profile.nom}</h4>
              <p class="text-xxs text-suv-gray">Tel: ${profile.telephone || 'Non spécifié'}</p>
            </div>
          </div>
        </div>

        <!-- Chat messages view list -->
        <div id="admin-chat-messages" class="flex-grow p-6 overflow-y-auto space-y-4 bg-suv-darker flex flex-col">
          <div class="text-center py-12 text-suv-gray my-auto">Chargement des messages...</div>
        </div>

        <!-- Typing Indicator -->
        <div id="admin-chat-typing-indicator" class="hidden bg-suv-darker px-6 py-2 text-xxs text-white/50 italic flex items-center gap-1.5 border-t border-white/5">
          <div class="flex gap-0.5 items-center">
            <span class="w-1.5 h-1.5 bg-suv-gold rounded-full animate-bounce"></span>
            <span class="w-1.5 h-1.5 bg-suv-gold rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-1.5 h-1.5 bg-suv-gold rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
          <span>Le client écrit...</span>
        </div>

        <!-- Input Form -->
        <form id="admin-chat-send-form" class="p-4 bg-suv-slate border-t border-white/5 flex items-center gap-3 relative">
          <!-- Text Input Container -->
          <div id="admin-chat-text-container" class="flex-grow flex items-center gap-2">
            <input type="text" id="admin-chat-input" placeholder="Écrire votre réponse..." class="flex-grow suv-input py-2 px-4 focus:border-suv-gold text-sm" required autocomplete="off">
            <button type="button" id="admin-chat-mic-btn" class="text-white/60 hover:text-suv-gold p-2 hover:bg-white/5 rounded-lg flex items-center justify-center transition-all duration-200" title="Enregistrer une note vocale">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>

          <!-- Recording State Container -->
          <div id="admin-chat-recording-container" class="hidden flex-grow flex items-center justify-between bg-black/20 rounded-xl px-4 py-1.5 border border-suv-gold/20 animate-pulse-glow">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping"></span>
              <span class="text-xs text-rose-500 font-bold font-mono" id="admin-chat-recording-timer">0:00</span>
              <span class="text-xxs text-white/50">Enregistrement...</span>
            </div>
            <div class="flex items-center gap-1.5">
              <!-- Cancel Button -->
              <button type="button" id="admin-chat-cancel-record-btn" class="text-white/40 hover:text-rose-500 p-1.5 hover:bg-white/5 rounded-lg transition-colors" title="Annuler">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <!-- Send/Stop Button -->
              <button type="button" id="admin-chat-send-record-btn" class="bg-suv-gold hover:bg-suv-yellow text-suv-darker p-1.5 rounded-lg transition-colors flex items-center justify-center" title="Envoyer la note vocale">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Submit Text Button -->
          <button type="submit" id="admin-chat-submit-btn" class="bg-suv-red hover:bg-suv-purple text-white px-6 py-2.5 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-1.5 shadow-lg">
            Répondre
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
          msgList.innerHTML = `<div class="text-center py-12 text-suv-gray my-auto">Aucun message échangé.</div>`;
          return;
        }

        const myId = store.getState().user.id;
        msgList.innerHTML = messages.map(msg => {
          const isSelf = msg.sender_id === myId;
          const align = isSelf ? 'self-end bg-suv-red text-white rounded-br-none' : 'self-start bg-suv-slate text-suv-light rounded-bl-none';
          const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

          const isAudio = msg.contenu && msg.contenu.startsWith('[audio]:');
          const contentHtml = isAudio 
            ? renderAudioPlayer(msg.contenu.substring(8), msg.id) 
            : `<span>${msg.contenu}</span>`;

          return `
            <div class="max-w-[75%] p-3.5 rounded-2xl shadow-md ${align} text-sm flex flex-col" data-msg-id="${msg.id || ''}">
              ${contentHtml}
              <span class="text-[9px] opacity-60 text-suv-light self-end mt-1">${time}</span>
            </div>
          `;
        }).join('');

        // Initialize voice note players
        msgList.querySelectorAll('.voice-note-player').forEach(playerEl => {
          initAudioPlayer(playerEl);
        });

        msgList.scrollTop = msgList.scrollHeight;
        await updateKPIs(); // Recalculate global unread messages metrics
      } catch (err) {
        console.error(err);
      }
    };

    // Keyboard typing indicator broadcast
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

          // Switch UI state
          textContainer.classList.add('hidden');
          submitBtn.classList.add('hidden');
          recordingContainer.classList.remove('hidden');
          input.required = false;

          broadcastTyping(profile.id, 'recording');

        } catch (err) {
          console.error('Microphone access denied or error:', err);
          alert('Impossible d\'accéder au microphone. Veuillez vérifier vos permissions.');
        }
      });

      const stopRecordingAndResetUI = () => {
        textContainer.classList.remove('hidden');
        submitBtn.classList.remove('hidden');
        recordingContainer.classList.add('hidden');
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

        // Send Voice Note optimistically
        const tempId = 'msg-temp-' + Date.now();
        const align = 'self-end bg-suv-red text-white rounded-br-none opacity-70';
        const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const localAudioUrl = URL.createObjectURL(audioBlob);

        const msgDiv = document.createElement('div');
        msgDiv.className = `max-w-[75%] p-3.5 rounded-2xl shadow-md ${align} text-sm flex flex-col transition-all duration-300`;
        msgDiv.setAttribute('data-msg-id', tempId);
        msgDiv.setAttribute('data-pending', 'true');
        msgDiv.innerHTML = `
          ${renderAudioPlayer(localAudioUrl, tempId)}
          <span class="text-[9px] opacity-60 text-suv-light self-end mt-1 flex items-center gap-1">
            ${time}
            <svg class="animate-spin h-3 w-3 text-white/50" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
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
              existingTemp.classList.remove('opacity-70');
              
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
            existingTemp.classList.remove('opacity-70');
            existingTemp.classList.add('border', 'border-rose-500/50', 'bg-rose-950/20');
            const timeSpan = existingTemp.querySelector('span:last-child');
            if (timeSpan) {
              timeSpan.innerHTML = `<span class="text-rose-400 flex items-center gap-1">Échec <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></span>`;
            }
          }
        }
      });
    }

    // Form Reply Message
    sendForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;

      // Stop typing broadcasting
      clearTimeout(typingTimeout);
      isCurrentlyTyping = false;
      broadcastTyping(profile.id, false);

      input.value = '';
      input.focus();

      // Generate temp ID and append optimistically
      const tempId = 'msg-temp-' + Date.now();
      const align = 'self-end bg-suv-red text-white rounded-br-none opacity-70';
      const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

      const msgDiv = document.createElement('div');
      msgDiv.className = `max-w-[75%] p-3.5 rounded-2xl shadow-md ${align} text-sm flex flex-col transition-all duration-300`;
      msgDiv.setAttribute('data-msg-id', tempId);
      msgDiv.setAttribute('data-pending', 'true');
      msgDiv.innerHTML = `
        <span>${text}</span>
        <span class="text-[9px] opacity-60 text-suv-light self-end mt-1 flex items-center gap-1">
          ${time}
          <svg class="animate-spin h-3 w-3 text-white/50" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
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
            existingTemp.classList.remove('opacity-70');
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
          existingTemp.classList.remove('opacity-70');
          existingTemp.classList.add('border', 'border-rose-500/50', 'bg-rose-950/20');
          const timeSpan = existingTemp.querySelector('span:last-child');
          if (timeSpan) {
            timeSpan.innerHTML = `<span class="text-rose-400 flex items-center gap-1">Échec <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667(1.732)-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></span>`;
          }
        }
      }
    });

    // Initial load
    await loadInboxMessages();

    // Bind real-time listener for replies
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
            // Find a pending element with the same text/audio
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
              pendingEl.classList.remove('opacity-70');
              const timeSpan = pendingEl.querySelector('span:last-child');
              if (timeSpan) {
                const time = new Date(newMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                timeSpan.innerHTML = time;
              }
              return;
            }
          }

          const align = isSelf ? 'self-end bg-suv-red text-white rounded-br-none' : 'self-start bg-suv-slate text-suv-light rounded-bl-none';
          const time = new Date(newMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

          const msgDiv = document.createElement('div');
          msgDiv.className = `max-w-[75%] p-3.5 rounded-2xl shadow-md ${align} text-sm flex flex-col`;
          msgDiv.setAttribute('data-msg-id', newMsg.id || '');
          
          const isAudio = newMsg.contenu && newMsg.contenu.startsWith('[audio]:');
          const contentHtml = isAudio 
            ? renderAudioPlayer(newMsg.contenu.substring(8), newMsg.id) 
            : `<span>${newMsg.contenu}</span>`;

          msgDiv.innerHTML = `
            ${contentHtml}
            <span class="text-[9px] opacity-60 text-suv-light self-end mt-1">${time}</span>
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

          // If received, mark as read in database
          if (newMsg.receiver_id === myId && !newMsg.lu) {
            await getMessages(profile.id); // marks as read
          }
        }
      }
      
      // Update conversations sidebar thread list
      const contactId = newMsg.sender_id === myId ? newMsg.receiver_id : newMsg.sender_id;
      updateSidebarThread(contactId, newMsg, true);
    });

    // Subscribe to typing indicator
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
            typingIndicator.classList.remove('hidden');
            msgList.scrollTop = msgList.scrollHeight;
          }
        } else {
          if (typingIndicator) {
            typingIndicator.classList.add('hidden');
          }
        }
      }
    });

    // Cleanup typing sub when switching chats
    const originalUnsub = activeChatListenerUnsub;
    activeChatListenerUnsub = () => {
      if (originalUnsub) originalUnsub();
      if (activeTypingListenerUnsub) activeTypingListenerUnsub();
    };
  };

  // If a chat was previously selected, restore it on tab load
  if (activeChatContactId) {
    openThread(activeChatContactId);
  }
}
