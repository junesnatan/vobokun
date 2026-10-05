import { store } from '../store.js';
import { getFavorites } from '../services/favorites.js';
import { getUserOffers, updateOfferStatus } from '../services/requests.js';
import { getMessages, sendMessage, subscribeToMessages } from '../services/messages.js';
import { updateProfile, uploadAvatar, getAdminUserId } from '../services/auth.js';
import { renderVehicleCard, initVehicleCards } from '../components/vehicle-card.js';

import { getCachedUser } from '../services/auth.js';

let activeTab = 'favorites'; // 'favorites' | 'offers' | 'chat' | 'profile'
let chatListenerUnsub = null;
let offersListenerUnsub = null;

export function render() {
  const user = store.getState().user || getCachedUser();
  if (!user) {
    return `
      <div class="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-fade-in space-y-6">
        <div class="w-16 h-16 rounded-2xl bg-gradient-premium-red flex items-center justify-center font-black text-white text-2xl shadow-xl shadow-suv-red/20 mx-auto">V</div>
        <div class="space-y-2">
          <h2 class="text-2xl font-bold text-white font-display">Connexion à votre Espace Client</h2>
          <p class="text-sm text-suv-gray max-w-md">Connectez-vous pour retrouver vos favoris, suivre vos demandes et discuter avec nos conseillers.</p>
        </div>
        <div class="flex gap-4">
          <a href="/login" class="bg-gradient-premium-red hover:shadow-lg text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all" data-link>
            Se Connecter / S'inscrire
          </a>
        </div>
      </div>
    `;
  }

  const avatar = user.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';
  const initials = `${user.prenom[0] || ''}${user.nom[0] || ''}`.toUpperCase();

  return `
    <div class="animate-fade-in space-y-8 text-left">
      
      <!-- Profile Header Summary -->
      <div class="glass-panel border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div class="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-suv-gold/5 blur-[40px]"></div>
        
        <div class="flex items-center gap-4 text-center md:text-left flex-col md:flex-row">
          <div class="relative group cursor-pointer" id="header-avatar-container" title="Modifier mon profil / ma photo">
            <img id="dashboard-header-avatar" src="${avatar}" alt="${user.prenom}" class="w-20 h-20 rounded-full object-cover border-2 border-suv-gold/40 shadow-xl group-hover:opacity-75 transition-opacity" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'">
            <div class="absolute bottom-0 right-0 w-6.5 h-6.5 rounded-full bg-suv-red border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
          <div>
            <h1 class="text-2xl font-extrabold text-white font-display">${user.prenom} ${user.nom}</h1>
            <p class="text-sm text-suv-gray font-medium mt-1">Espace Client • Membre depuis ${new Date(user.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div class="flex gap-3 text-xs">
          <span class="bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-white/80 font-medium">Tel: ${user.telephone || 'Non renseigné'}</span>
          <span class="bg-suv-gold/10 border border-suv-gold/20 text-suv-gold px-3.5 py-2 rounded-xl font-bold">${user.role === 'admin' ? 'Admin' : 'Client'}</span>
        </div>
      </div>

      <!-- Dashboard Grid Layout -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Sidebar Navigation (lg: 3 cols) -->
        <nav class="lg:col-span-3 glass-panel border border-white/5 rounded-2xl p-4 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2">
          
          <button data-tab="favorites" class="tab-btn flex-1 lg:flex-none text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 ${activeTab === 'favorites' ? 'bg-suv-red text-white shadow-lg shadow-suv-red/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            Favoris
          </button>
          
          <button data-tab="offers" class="tab-btn flex-1 lg:flex-none text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 ${activeTab === 'offers' ? 'bg-suv-red text-white shadow-lg shadow-suv-red/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            Mes Demandes
          </button>
          
          <button data-tab="chat" class="tab-btn flex-1 lg:flex-none text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 relative ${activeTab === 'chat' ? 'bg-suv-red text-white shadow-lg shadow-suv-red/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            Messagerie Directe
            <span id="inbox-badge" class="absolute right-4 bg-suv-gold text-suv-red text-[10px] font-extrabold px-1.5 py-0.5 rounded-full hidden">0</span>
          </button>
          
          <button data-tab="profile" class="tab-btn flex-1 lg:flex-none text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 ${activeTab === 'profile' ? 'bg-suv-red text-white shadow-lg shadow-suv-red/20' : 'text-white/60 hover:bg-white/5 hover:text-white'}">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            Mon Profil
          </button>

        </nav>

        <!-- Main Workspace (lg: 9 cols) -->
        <main class="lg:col-span-9" id="dashboard-workspace">
          <!-- Populated dynamically based on activeTab -->
        </main>

      </div>

    </div>
  `;
}

export async function init() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  
  const switchWorkspaceTab = (tab) => {
    activeTab = tab;
    tabButtons.forEach(btn => {
      const isMatch = btn.getAttribute('data-tab') === tab;
      if (isMatch) {
        btn.className = "tab-btn flex-1 lg:flex-none text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 bg-suv-red text-white shadow-lg shadow-suv-red/20";
      } else {
        btn.className = "tab-btn flex-1 lg:flex-none text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 text-white/60 hover:bg-white/5 hover:text-white";
      }
    });

    renderTabContent();
  };

  // Check for tab parameter in URL query on page load
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  if (tabParam && ['favorites', 'offers', 'chat', 'profile'].includes(tabParam)) {
    activeTab = tabParam;
  } else {
    activeTab = 'favorites';
  }

  // Set initial active tab classes on buttons
  tabButtons.forEach(btn => {
    const btnTab = btn.getAttribute('data-tab');
    if (btnTab === activeTab) {
      btn.className = "tab-btn flex-1 lg:flex-none text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 bg-suv-red text-white shadow-lg shadow-suv-red/20";
    } else {
      btn.className = "tab-btn flex-1 lg:flex-none text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center gap-2.5 text-white/60 hover:bg-white/5 hover:text-white";
    }
  });

  // Bind side menu buttons
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchWorkspaceTab(btn.getAttribute('data-tab'));
    });
  });

  // Bind click on header avatar container to switch tab to profile and open file picker
  const avatarContainer = document.getElementById('header-avatar-container');
  if (avatarContainer) {
    avatarContainer.addEventListener('click', () => {
      switchWorkspaceTab('profile');
      setTimeout(() => {
        const fileInput = document.getElementById('profile-avatar-file-input');
        if (fileInput) fileInput.click();
      }, 150);
    });
  }

  // Watch unread messages badge updates
  store.subscribe(state => {
    const inboxBadge = document.getElementById('inbox-badge');
    if (inboxBadge) {
      if (state.unreadMessagesCount > 0) {
        inboxBadge.textContent = state.unreadMessagesCount;
        inboxBadge.classList.remove('hidden');
      } else {
        inboxBadge.classList.add('hidden');
      }
    }
  });

  // Load initial tab content
  renderTabContent();
}

// Render the selected tab's content workspace
async function renderTabContent() {
  const space = document.getElementById('dashboard-workspace');
  if (!space) return;

  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';

  // Cleanup past event listeners/subscriptions
  if (chatListenerUnsub) {
    chatListenerUnsub();
    chatListenerUnsub = null;
  }
  if (offersListenerUnsub) {
    offersListenerUnsub();
    offersListenerUnsub = null;
  }

  space.innerHTML = `<div class="text-center py-12 text-suv-gray">Chargement du contenu...</div>`;

  try {
    if (activeTab === 'favorites') {
      const { data: favorites } = await getFavorites();
      
      if (favorites.length === 0) {
        space.innerHTML = `
          <div class="glass-panel border border-white/5 rounded-2xl p-10 text-center space-y-4">
            <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </div>
            <h3 class="font-bold text-lg text-white">Aucun favori enregistré</h3>
            <p class="text-sm text-suv-gray max-w-sm mx-auto">Parcourez le catalogue et cliquez sur l'icône cœur d'un véhicule pour le retrouver ici.</p>
            <a href="/catalogue" class="inline-block bg-suv-red hover:bg-suv-purple text-white px-6 py-2.5 rounded-lg font-bold text-xs uppercase" data-link>Découvrir les SUV</a>
          </div>
        `;
        return;
      }

      space.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" id="fav-dashboard-grid">
          ${favorites.map(v => renderVehicleCard(v, true)).join('')}
        </div>
      `;
      initVehicleCards(document.getElementById('fav-dashboard-grid'));

    } else if (activeTab === 'offers') {
      const { data: offers } = await getUserOffers();

      if (offers.length === 0) {
        space.innerHTML = `
          <div class="glass-panel border border-white/5 rounded-2xl p-10 text-center space-y-4">
            <div class="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
            </div>
            <h3 class="font-bold text-lg text-white">Aucune demande en cours</h3>
            <p class="text-sm text-suv-gray max-w-sm mx-auto">Lorsque vous négociez le prix d'un SUV ou envoyez une demande de contact, elle s'affichera ici.</p>
          </div>
        `;
        return;
      }

      // Render timeline/offers list
      const offersHTML = offers.map(o => {
        let statusBadge = '';
        if (o.statut === 'pending') {
          statusBadge = '<span class="bg-amber-500/10 text-amber-400 border border-amber-500/25 px-2.5 py-1 rounded-lg text-xs font-bold">En attente</span>';
        } else if (o.statut === 'accepted') {
          statusBadge = '<span class="bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 px-2.5 py-1 rounded-lg text-xs font-bold">Acceptée</span>';
        } else if (o.statut === 'refused') {
          statusBadge = '<span class="bg-rose-500/10 text-rose-400 border border-rose-500/25 px-2.5 py-1 rounded-lg text-xs font-bold">Refusée</span>';
        } else {
          statusBadge = '<span class="bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2.5 py-1 rounded-lg text-xs font-bold">En cours de négociation</span>';
        }

        const priceHTML = o.prix_propose 
          ? `<p class="text-xs text-white/50">Proposition : <span class="text-suv-gold font-bold text-sm font-sans">${new Intl.NumberFormat('fr-FR').format(o.prix_propose)} ${currency}</span></p>`
          : '<p class="text-xs text-white/50">Demande d\'information (Aucune offre de prix)</p>';

        const vehicleTitle = o.vehicle 
          ? `<a href="/vehicle/${o.vehicle.id}" class="font-bold hover:text-suv-gold transition-colors font-display" data-link>${o.vehicle.marque} ${o.vehicle.modele} (${o.vehicle.annee})</a>`
          : 'SUV supprimé du catalogue';

        return `
          <div class="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
            <div class="flex justify-between items-start gap-4 flex-wrap">
              <div class="space-y-1">
                ${vehicleTitle}
                ${priceHTML}
              </div>
              ${statusBadge}
            </div>

            <div class="bg-white/5 p-4 rounded-xl text-sm leading-relaxed border border-white/5">
              <p class="text-xxs uppercase tracking-wider text-suv-gray font-bold mb-1.5">Votre message :</p>
              <p class="text-white/80 font-light">${o.message}</p>
            </div>

            ${o.note_admin ? `
              <div class="bg-suv-gold/5 p-4 rounded-xl text-sm leading-relaxed border border-suv-gold/15">
                <p class="text-xxs uppercase tracking-wider text-suv-gold font-bold mb-1.5">Note du conseiller :</p>
                <p class="text-suv-light/90">${o.note_admin}</p>
              </div>
            ` : ''}

            ${o.statut === 'in_progress' ? `
              <div class="flex gap-3 pt-2" data-offer-id="${o.id}">
                <button class="client-accept-btn bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-emerald-600/10">
                  Accepter la proposition
                </button>
                <button class="client-refuse-btn bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-rose-600/10">
                  Refuser
                </button>
              </div>
            ` : ''}

            <div class="text-[10px] text-white/30 text-right">
              Soumis le ${new Date(o.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        `;
      }).join('');

      space.innerHTML = `<div class="space-y-6">${offersHTML}</div>`;

      // Bind client action buttons
      document.querySelectorAll('.client-accept-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const offerId = btn.closest('[data-offer-id]').getAttribute('data-offer-id');
          try {
            btn.disabled = true;
            btn.textContent = 'Acceptation...';
            await updateOfferStatus(offerId, 'accepted', "Proposition acceptée par le client.");
            alert('Félicitations ! Vous avez accepté la proposition. Notre équipe vous contactera sous peu.');
            renderTabContent();
          } catch (err) {
            console.error(err);
            alert('Erreur: ' + err.message);
            btn.disabled = false;
            btn.textContent = 'Accepter la proposition';
          }
        });
      });

      document.querySelectorAll('.client-refuse-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const offerId = btn.closest('[data-offer-id]').getAttribute('data-offer-id');
          try {
            btn.disabled = true;
            btn.textContent = 'Refus...';
            await updateOfferStatus(offerId, 'refused', "Proposition déclinée par le client.");
            alert('Vous avez refusé la proposition.');
            renderTabContent();
          } catch (err) {
            console.error(err);
            alert('Erreur: ' + err.message);
            btn.disabled = false;
            btn.textContent = 'Refuser';
          }
        });
      });

      // Realtime subscription for offers
      const { subscribeToOffers } = await import('../services/requests.js');
      offersListenerUnsub = subscribeToOffers(async () => {
        renderTabContent();
      });

    } else if (activeTab === 'chat') {
      let adminId = 'admin-id';
      const fetchedAdminId = await getAdminUserId();
      if (fetchedAdminId) {
        adminId = fetchedAdminId;
      }

      space.innerHTML = `
        <div class="glass-panel border border-white/5 rounded-2xl h-[550px] flex flex-col overflow-hidden">
          
          <!-- Chat box header -->
          <div class="bg-white/5 border-b border-white/5 px-6 py-4 flex items-center gap-3">
            <div class="relative">
              <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Admin" class="w-10 h-10 rounded-full object-cover border border-suv-gold/25">
              <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-suv-slate rounded-full"></span>
            </div>
            <div>
              <h3 class="font-bold text-white text-sm font-display">Concessionnaire SUV</h3>
              <p class="text-xxs text-emerald-400">Conseiller en ligne</p>
            </div>
          </div>

          <!-- Chat List -->
          <div id="dashboard-messages-list" class="flex-grow p-6 overflow-y-auto space-y-4 bg-suv-darker flex flex-col">
            <!-- Messages rendered dynamically -->
          </div>

          <!-- Input Form -->
          <form id="dashboard-chat-form" class="p-4 bg-suv-slate border-t border-white/5 flex gap-3">
            <input type="text" id="dashboard-chat-input" placeholder="Écrivez votre message à notre équipe..." class="flex-grow suv-input py-2 px-4 focus:border-suv-gold text-sm" required autocomplete="off">
            <button type="submit" class="bg-suv-red hover:bg-suv-purple text-white px-6 rounded-xl font-bold transition-all text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-suv-red/15">
              Envoyer
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </form>

        </div>
      `;

      const list = document.getElementById('dashboard-messages-list');
      const form = document.getElementById('dashboard-chat-form');
      const input = document.getElementById('dashboard-chat-input');

      // Fetch and draw messages
      const loadInbox = async () => {
        try {
          const { data: messages } = await getMessages(adminId);
          
          if (messages.length === 0) {
            list.innerHTML = `
              <div class="text-center py-16 text-suv-gray space-y-2 my-auto">
                <svg class="w-12 h-12 text-white/10 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                <p class="font-semibold text-white/80">Démarrez la conversation</p>
                <p class="text-xs text-white/30">Posez vos questions sur nos SUV ou demandez un essai.</p>
              </div>
            `;
            return;
          }

          const myId = store.getState().user.id;
          list.innerHTML = messages.map(msg => {
            const isSelf = msg.sender_id === myId;
            const align = isSelf ? 'self-end bg-suv-red text-white rounded-br-none' : 'self-start bg-suv-slate text-suv-light rounded-bl-none';
            const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            return `
              <div class="max-w-[70%] p-3.5 rounded-2xl shadow-md ${align} text-sm flex flex-col" data-msg-id="${msg.id || ''}">
                <span>${msg.contenu}</span>
                <span class="text-[9px] opacity-60 text-suv-light self-end mt-1.5">${time}</span>
              </div>
            `;
          }).join('');

          list.scrollTop = list.scrollHeight;
          store.updateUnreadCount();
        } catch (err) {
          console.error(err);
          list.innerHTML = `<div class="text-center py-4 text-xs text-rose-400">Erreur lors de la récupération des messages.</div>`;
        }
      };

      // Form Send Message
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        input.disabled = true;

        try {
          const { data: sentMsg } = await sendMessage(adminId, text);
          if (sentMsg) {
            const existing = list.querySelector(`[data-msg-id="${sentMsg.id}"]`);
            if (!existing) {
              const bgClass = 'self-end bg-suv-red text-white rounded-br-none';
              const time = new Date(sentMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

              const msgDiv = document.createElement('div');
              msgDiv.className = `max-w-[70%] p-3.5 rounded-2xl shadow-md ${bgClass} text-sm flex flex-col`;
              msgDiv.setAttribute('data-msg-id', sentMsg.id || '');
              msgDiv.innerHTML = `
                <span>${sentMsg.contenu}</span>
                <span class="text-[9px] opacity-60 text-suv-light self-end mt-1.5">${time}</span>
              `;

              const placeholder = list.querySelector('.my-auto');
              if (placeholder) {
                list.innerHTML = '';
              }

              list.appendChild(msgDiv);
              list.scrollTop = list.scrollHeight;
            }
          }
        } catch (err) {
          console.error('Failed to send dashboard message', err);
        } finally {
          input.disabled = false;
          input.focus();
        }
      });

      // Fetch initial
      await loadInbox();

      // Realtime subscription binding
      chatListenerUnsub = subscribeToMessages(async (newMsg) => {
        const myId = store.getState().user.id;
        const belongs = (newMsg.sender_id === adminId && newMsg.receiver_id === myId) || 
                        (newMsg.sender_id === myId && newMsg.receiver_id === adminId);
        if (belongs) {
          const existing = list.querySelector(`[data-msg-id="${newMsg.id}"]`);
          if (!existing) {
            const isSelf = newMsg.sender_id === myId;
            const align = isSelf ? 'self-end bg-suv-red text-white rounded-br-none' : 'self-start bg-suv-slate text-suv-light rounded-bl-none';
            const time = new Date(newMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            const msgDiv = document.createElement('div');
            msgDiv.className = `max-w-[70%] p-3.5 rounded-2xl shadow-md ${align} text-sm flex flex-col`;
            msgDiv.setAttribute('data-msg-id', newMsg.id || '');
            msgDiv.innerHTML = `
              <span>${newMsg.contenu}</span>
              <span class="text-[9px] opacity-60 text-suv-light self-end mt-1.5">${time}</span>
            `;

            const placeholder = list.querySelector('.my-auto');
            if (placeholder) {
              list.innerHTML = '';
            }

            list.appendChild(msgDiv);
            list.scrollTop = list.scrollHeight;

            if (newMsg.receiver_id === myId && !newMsg.lu) {
              await getMessages(adminId); // marks read
            }
          }
        }
      });

    } else if (activeTab === 'profile') {
      const user = store.getState().user;
      const initials = `${user.prenom?.[0] || ''}${user.nom?.[0] || ''}`.toUpperCase();

      space.innerHTML = `
        <div class="glass-panel border border-white/5 rounded-2xl p-6 md:p-8 space-y-6">
          <h3 class="text-md font-bold uppercase tracking-wider text-white font-display">Informations Personnelles</h3>
          
          <form id="profile-edit-form" class="space-y-6">
            
            <!-- Avatar Upload Row -->
            <div class="flex items-center gap-6 flex-wrap md:flex-nowrap border-b border-white/5 pb-6">
              <img id="profile-edit-avatar-preview" src="${user.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}" class="w-16 h-16 rounded-full object-cover border border-white/10" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'">
              
              <div class="space-y-2 text-left">
                <label class="block text-xs font-bold uppercase tracking-wider text-suv-gray">Photo de profil</label>
                <div class="flex items-center gap-3">
                  <input type="file" id="profile-avatar-file-input" accept="image/*" class="hidden">
                  <button type="button" id="select-avatar-btn" class="bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold px-4 py-2.5 rounded-lg transition-colors">
                    Téléverser une image
                  </button>
                  <span class="text-xxs text-white/30 font-medium">JPEG, PNG max 5MB</span>
                </div>
              </div>
            </div>

            <!-- Inputs -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Prénom</label>
                <input type="text" id="prof-prenom" value="${user.prenom || ''}" class="w-full suv-input" required>
              </div>
              
              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Nom de famille</label>
                <input type="text" id="prof-nom" value="${user.nom || ''}" class="w-full suv-input" required>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Numéro de téléphone</label>
                <input type="tel" id="prof-telephone" value="${user.telephone || ''}" placeholder="+229 01 00 00 00 00" class="w-full suv-input" required>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-bold uppercase tracking-wider text-suv-gray">Adresse Email (Non modifiable)</label>
                <input type="email" value="${user.email || ''}" disabled class="w-full suv-input opacity-50 cursor-not-allowed">
              </div>
            </div>

            <!-- Submit -->
            <div class="text-right pt-4 border-t border-white/5">
              <button type="submit" id="save-profile-btn" class="bg-suv-red hover:bg-suv-purple text-white px-8 py-3 rounded-xl font-bold transition-all text-sm shadow-lg shadow-suv-red/10">
                Enregistrer les modifications
              </button>
            </div>

          </form>
        </div>
      `;

      const editForm = document.getElementById('profile-edit-form');
      const avatarBtn = document.getElementById('select-avatar-btn');
      const avatarInput = document.getElementById('profile-avatar-file-input');
      const avatarPreview = document.getElementById('profile-edit-avatar-preview');
      let uploadedAvatarUrl = null;

      // Handle avatar file selector click
      if (avatarBtn && avatarInput) {
        avatarBtn.addEventListener('click', () => avatarInput.click());
      }

      // Handle avatar change
      if (avatarInput) {
        avatarInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;

          try {
            avatarBtn.textContent = 'Envoi...';
            avatarBtn.disabled = true;
            
            const publicUrl = await uploadAvatar(file);
            uploadedAvatarUrl = publicUrl;
            
            if (avatarPreview) avatarPreview.setAttribute('src', publicUrl);
            alert('Image chargée avec succès. Pensez à enregistrer vos modifications de profil.');
          } catch (err) {
            console.error('Avatar upload failed:', err);
            alert('Échec de l\'upload: ' + err.message);
          } finally {
            avatarBtn.textContent = 'Téléverser une image';
            avatarBtn.disabled = false;
          }
        });
      }

      // Profile edit form submit
      if (editForm) {
        editForm.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const prenom = document.getElementById('prof-prenom').value.trim();
          const nom = document.getElementById('prof-nom').value.trim();
          const telephone = document.getElementById('prof-telephone').value.trim();

          const saveBtn = document.getElementById('save-profile-btn');
          saveBtn.disabled = true;
          saveBtn.textContent = 'Enregistrement...';

          try {
            const updatePayload = { prenom, nom, telephone };
            if (uploadedAvatarUrl) updatePayload.avatar_url = uploadedAvatarUrl;

            await updateProfile(updatePayload);
            
            // Sync dashboard summary layout image
            const headerAvatar = document.getElementById('dashboard-header-avatar');
            if (headerAvatar && uploadedAvatarUrl) {
              headerAvatar.setAttribute('src', uploadedAvatarUrl);
            }
            alert('Votre profil a été mis à jour.');
          } catch (err) {
            console.error('Profile update failed:', err);
            alert('Erreur: ' + err.message);
          } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Enregistrer les modifications';
          }
        });
      }

    }
  } catch (err) {
    console.error('Workspace draw failed:', err);
    space.innerHTML = `<div class="text-center py-12 text-rose-400">Erreur lors de la construction du panneau.</div>`;
  }
}
