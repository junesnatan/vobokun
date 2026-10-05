import { store } from '../store.js';
import { getFavorites } from '../services/favorites.js';
import { getUserOffers, updateOfferStatus } from '../services/requests.js';
import { getMessages, sendMessage, subscribeToMessages } from '../services/messages.js';
import { updateProfile, uploadAvatar, getAdminUserId, getCachedUser } from '../services/auth.js';
import { renderVehicleCard, initVehicleCards } from '../components/vehicle-card.js';

let activeTab = 'favorites';
let chatListenerUnsub = null;
let offersListenerUnsub = null;

export function render() {
  const user = store.getState().user || getCachedUser();
  if (!user) {
    return `
      <div class="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 animate-fade-in space-y-6">
        <div class="w-16 h-16 rounded-2xl bg-gradient-premium-gold flex items-center justify-center font-black text-black text-2xl shadow-xl shadow-suv-gold/20 mx-auto">V</div>
        <div class="space-y-2">
          <h2 class="text-2xl font-black text-white font-display uppercase tracking-tight">Espace Client Vobokun</h2>
          <p class="text-xs text-suv-gray max-w-md">Connectez-vous pour retrouver vos véhicules favoris, suivre vos négociations et discuter avec nos conseillers.</p>
        </div>
        <div>
          <a href="/login" class="btn-premium-gold px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider" data-link>
            Se Connecter / S'inscrire
          </a>
        </div>
      </div>
    `;
  }

  const avatar = user.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

  return `
    <div class="animate-fade-in space-y-8 text-left">
      
      <!-- Profile Header Summary Banner -->
      <div class="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div class="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-suv-gold/10 blur-[50px] pointer-events-none"></div>
        
        <div class="flex items-center gap-5 text-center md:text-left flex-col md:flex-row relative z-10">
          <div class="relative group cursor-pointer" id="header-avatar-container" title="Modifier mon profil">
            <img id="dashboard-header-avatar" src="${avatar}" alt="${user.prenom}" class="w-20 h-20 rounded-full object-cover border-2 border-suv-gold/50 shadow-xl group-hover:opacity-80 transition-opacity" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'">
            <div class="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-suv-gold border border-black flex items-center justify-center text-black shadow-md group-hover:scale-110 transition-transform">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              </svg>
            </div>
          </div>
          <div>
            <div class="flex items-center justify-center md:justify-start gap-2">
              <h1 class="text-2xl font-black text-white font-display uppercase tracking-tight">${user.prenom} ${user.nom}</h1>
              <span class="bg-suv-gold/15 border border-suv-gold/30 text-suv-gold text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">VIP</span>
            </div>
            <p class="text-xs text-suv-gray font-medium mt-1">Espace Client Vobokun &middot; Membre depuis ${new Date(user.created_at || Date.now()).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3 text-xs relative z-10">
          <span class="bg-white/5 border border-white/10 px-3.5 py-2 rounded-xl text-white/80 font-semibold">Tél : ${user.telephone || 'Non renseigné'}</span>
          <span class="bg-suv-gold/15 border border-suv-gold/30 text-suv-gold px-3.5 py-2 rounded-xl font-bold uppercase tracking-wider">${user.role === 'admin' ? 'Admin' : 'Client Privilège'}</span>
        </div>
      </div>

      <!-- Dashboard Grid: Sidebar & Workspace -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- Sidebar Navigation Tabs -->
        <nav class="lg:col-span-3 glass-panel border border-white/10 rounded-3xl p-3 flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 shadow-xl">
          
          <button data-tab="favorites" class="tab-btn flex-1 lg:flex-none text-left px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${activeTab === 'favorites' ? 'btn-premium-gold text-black font-black shadow-lg' : 'text-white/70 hover:bg-white/5 hover:text-white'}">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            <span>Mes Favoris</span>
          </button>
          
          <button data-tab="offers" class="tab-btn flex-1 lg:flex-none text-left px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${activeTab === 'offers' ? 'btn-premium-gold text-black font-black shadow-lg' : 'text-white/70 hover:bg-white/5 hover:text-white'}">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
            <span>Mes Négociations</span>
          </button>
          
          <button data-tab="chat" class="tab-btn flex-1 lg:flex-none text-left px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 relative ${activeTab === 'chat' ? 'btn-premium-gold text-black font-black shadow-lg' : 'text-white/70 hover:bg-white/5 hover:text-white'}">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            <span>Messagerie Directe</span>
            <span id="inbox-badge" class="absolute right-4 bg-suv-gold text-black text-[10px] font-black px-1.5 py-0.5 rounded-full hidden">0</span>
          </button>
          
          <button data-tab="profile" class="tab-btn flex-1 lg:flex-none text-left px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 ${activeTab === 'profile' ? 'btn-premium-gold text-black font-black shadow-lg' : 'text-white/70 hover:bg-white/5 hover:text-white'}">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
            <span>Mon Profil</span>
          </button>

        </nav>

        <!-- Main Workspace Pane -->
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
        btn.className = "tab-btn flex-1 lg:flex-none text-left px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 btn-premium-gold text-black font-black shadow-lg";
      } else {
        btn.className = "tab-btn flex-1 lg:flex-none text-left px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 text-white/70 hover:bg-white/5 hover:text-white";
      }
    });

    renderTabContent();
  };

  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  if (tabParam && ['favorites', 'offers', 'chat', 'profile'].includes(tabParam)) {
    activeTab = tabParam;
  } else {
    activeTab = 'favorites';
  }

  tabButtons.forEach(btn => {
    const btnTab = btn.getAttribute('data-tab');
    if (btnTab === activeTab) {
      btn.className = "tab-btn flex-1 lg:flex-none text-left px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 btn-premium-gold text-black font-black shadow-lg";
    } else {
      btn.className = "tab-btn flex-1 lg:flex-none text-left px-4 py-3.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-3 text-white/70 hover:bg-white/5 hover:text-white";
    }
  });

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      switchWorkspaceTab(btn.getAttribute('data-tab'));
    });
  });

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

  renderTabContent();
}

async function renderTabContent() {
  const space = document.getElementById('dashboard-workspace');
  if (!space) return;

  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';

  if (chatListenerUnsub) {
    chatListenerUnsub();
    chatListenerUnsub = null;
  }
  if (offersListenerUnsub) {
    offersListenerUnsub();
    offersListenerUnsub = null;
  }

  space.innerHTML = `<div class="text-center py-16 text-suv-gray font-medium">Chargement instantané...</div>`;

  try {
    if (activeTab === 'favorites') {
      const { data: favorites } = await getFavorites();
      
      if (favorites.length === 0) {
        space.innerHTML = `
          <div class="glass-panel border border-white/10 rounded-3xl p-12 text-center space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-suv-gold">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </div>
            <h3 class="font-black text-xl text-white font-display uppercase tracking-tight">Aucun favori enregistré</h3>
            <p class="text-xs text-suv-gray max-w-sm mx-auto">Parcourez le catalogue et cliquez sur le cœur pour sauvegarder vos modèles préférés.</p>
            <a href="/catalogue" class="btn-premium-gold inline-block px-7 py-3 rounded-xl font-black text-xs uppercase tracking-wider mt-2" data-link>Découvrir les SUV</a>
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
          <div class="glass-panel border border-white/10 rounded-3xl p-12 text-center space-y-4">
            <div class="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-suv-gold">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
            </div>
            <h3 class="font-black text-xl text-white font-display uppercase tracking-tight">Aucune négociation en cours</h3>
            <p class="text-xs text-suv-gray max-w-sm mx-auto">Lorsque vous faites une offre de prix sur un véhicule, elle s'affiche ici avec son statut en temps réel.</p>
            <a href="/catalogue" class="btn-premium-gold inline-block px-7 py-3 rounded-xl font-black text-xs uppercase tracking-wider mt-2" data-link>Voir les véhicules</a>
          </div>
        `;
        return;
      }

      const offersHTML = offers.map(o => {
        let statusBadge = '';
        if (o.statut === 'pending') {
          statusBadge = '<span class="bg-amber-500/15 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase">En attente</span>';
        } else if (o.statut === 'accepted') {
          statusBadge = '<span class="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase">Offre Acceptée</span>';
        } else if (o.statut === 'refused') {
          statusBadge = '<span class="bg-rose-500/15 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase">Déclinée</span>';
        } else {
          statusBadge = '<span class="bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase">En Négociation</span>';
        }

        const priceHTML = o.prix_propose 
          ? `<p class="text-xs text-white/50">Offre proposée : <span class="text-suv-gold font-black text-sm font-sans">${new Intl.NumberFormat('fr-FR').format(o.prix_propose)} ${currency}</span></p>`
          : '<p class="text-xs text-white/50">Demande d\'information générale</p>';

        const vehicleTitle = o.vehicle 
          ? `<a href="/vehicle/${o.vehicle.id}" class="font-black text-base text-white hover:text-suv-gold transition-colors font-display uppercase" data-link>${o.vehicle.marque} ${o.vehicle.modele} (${o.vehicle.annee})</a>`
          : '<span class="font-bold text-white/60">Modèle archivé</span>';

        return `
          <div class="glass-card rounded-3xl p-6 border border-white/10 space-y-4">
            <div class="flex justify-between items-start gap-4 flex-wrap pb-3 border-b border-white/5">
              <div class="space-y-0.5">
                ${vehicleTitle}
                ${priceHTML}
              </div>
              ${statusBadge}
            </div>

            <div class="bg-white/5 p-4 rounded-2xl text-xs leading-relaxed border border-white/5">
              <p class="text-[9px] uppercase tracking-wider text-suv-gold font-black mb-1">Votre message :</p>
              <p class="text-white/80 font-normal">${o.message}</p>
            </div>

            ${o.note_admin ? `
              <div class="bg-suv-gold/10 p-4 rounded-2xl text-xs leading-relaxed border border-suv-gold/25">
                <p class="text-[9px] uppercase tracking-wider text-suv-gold font-black mb-1">Réponse du Concessionnaire :</p>
                <p class="text-white font-medium">${o.note_admin}</p>
              </div>
            ` : ''}

            ${o.statut === 'in_progress' ? `
              <div class="flex gap-3 pt-2" data-offer-id="${o.id}">
                <button class="client-accept-btn bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all shadow-lg">
                  Accepter la contre-proposition
                </button>
                <button class="client-refuse-btn bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3 px-5 rounded-xl transition-all">
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

      document.querySelectorAll('.client-accept-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const offerId = btn.closest('[data-offer-id]').getAttribute('data-offer-id');
          try {
            btn.disabled = true;
            btn.textContent = 'Acceptation...';
            await updateOfferStatus(offerId, 'accepted', "Proposition acceptée par le client.");
            alert('Félicitations ! Vous avez validé la proposition. Notre showroom prépare les documents.');
            renderTabContent();
          } catch (err) {
            console.error(err);
            btn.disabled = false;
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
            renderTabContent();
          } catch (err) {
            console.error(err);
            btn.disabled = false;
          }
        });
      });

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
        <div class="glass-panel border border-white/10 rounded-3xl h-[580px] flex flex-col overflow-hidden shadow-2xl">
          
          <!-- Chat Box Header -->
          <div class="bg-white/5 border-b border-white/10 px-6 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="relative">
                <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Conseiller" class="w-10 h-10 rounded-full object-cover border border-suv-gold/30">
                <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-black rounded-full"></span>
              </div>
              <div>
                <h3 class="font-black text-white text-sm font-display uppercase tracking-wide">Conseiller Vobokun</h3>
                <p class="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Showroom en direct</p>
              </div>
            </div>
            <span class="text-[10px] text-white/40 uppercase tracking-widest font-bold">Messagerie Sécurisée</span>
          </div>

          <!-- Messages Container -->
          <div id="dashboard-messages-list" class="flex-grow p-6 overflow-y-auto space-y-3.5 bg-[#080A0E] flex flex-col">
          </div>

          <!-- Input Form -->
          <form id="dashboard-chat-form" class="p-4 bg-[#0E1218] border-t border-white/10 flex gap-3">
            <input type="text" id="dashboard-chat-input" placeholder="Écrivez votre message à notre conseiller..." class="flex-grow suv-input py-3 px-4 text-xs font-semibold focus:border-suv-gold" required autocomplete="off">
            <button type="submit" class="btn-premium-gold px-6 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg">
              <span>Envoyer</span>
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/></svg>
            </button>
          </form>

        </div>
      `;

      const list = document.getElementById('dashboard-messages-list');
      const form = document.getElementById('dashboard-chat-form');
      const input = document.getElementById('dashboard-chat-input');

      const loadInbox = async () => {
        try {
          const { data: messages } = await getMessages(adminId);
          
          if (messages.length === 0) {
            list.innerHTML = `
              <div class="text-center py-20 text-suv-gray space-y-2 my-auto">
                <div class="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-suv-gold">
                  <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                </div>
                <p class="font-black text-white text-sm font-display uppercase tracking-wider">Démarrez votre conversation</p>
                <p class="text-xs text-white/40">Posez vos questions ou négociez le véhicule de votre choix.</p>
              </div>
            `;
            return;
          }

          const myId = store.getState().user.id;
          list.innerHTML = messages.map(msg => {
            const isSelf = msg.sender_id === myId;
            const align = isSelf ? 'self-end btn-premium-gold text-black rounded-br-none' : 'self-start bg-[#161D27] text-white rounded-bl-none border border-white/10';
            const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            return `
              <div class="max-w-[75%] p-3.5 rounded-2xl shadow-md ${align} text-xs flex flex-col" data-msg-id="${msg.id || ''}">
                <span class="leading-relaxed font-semibold">${msg.contenu}</span>
                <span class="text-[9px] opacity-60 self-end mt-1.5 font-sans">${time}</span>
              </div>
            `;
          }).join('');

          list.scrollTop = list.scrollHeight;
          store.updateUnreadCount();
        } catch (err) {
          console.error(err);
        }
      };

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
              const time = new Date(sentMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              const msgDiv = document.createElement('div');
              msgDiv.className = `max-w-[75%] p-3.5 rounded-2xl shadow-md self-end btn-premium-gold text-black rounded-br-none text-xs flex flex-col`;
              msgDiv.setAttribute('data-msg-id', sentMsg.id || '');
              msgDiv.innerHTML = `
                <span class="leading-relaxed font-semibold">${sentMsg.contenu}</span>
                <span class="text-[9px] opacity-60 self-end mt-1.5 font-sans">${time}</span>
              `;

              const placeholder = list.querySelector('.my-auto');
              if (placeholder) list.innerHTML = '';

              list.appendChild(msgDiv);
              list.scrollTop = list.scrollHeight;
            }
          }
        } catch (err) {
          console.error(err);
        } finally {
          input.disabled = false;
          input.focus();
        }
      });

      await loadInbox();

      chatListenerUnsub = subscribeToMessages(async (newMsg) => {
        const myId = store.getState().user.id;
        const belongs = (newMsg.sender_id === adminId && newMsg.receiver_id === myId) || 
                        (newMsg.sender_id === myId && newMsg.receiver_id === adminId);
        if (belongs) {
          const existing = list.querySelector(`[data-msg-id="${newMsg.id}"]`);
          if (!existing) {
            const isSelf = newMsg.sender_id === myId;
            const align = isSelf ? 'self-end btn-premium-gold text-black rounded-br-none' : 'self-start bg-[#161D27] text-white rounded-bl-none border border-white/10';
            const time = new Date(newMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            const msgDiv = document.createElement('div');
            msgDiv.className = `max-w-[75%] p-3.5 rounded-2xl shadow-md ${align} text-xs flex flex-col`;
            msgDiv.setAttribute('data-msg-id', newMsg.id || '');
            msgDiv.innerHTML = `
              <span class="leading-relaxed font-semibold">${newMsg.contenu}</span>
              <span class="text-[9px] opacity-60 self-end mt-1.5 font-sans">${time}</span>
            `;

            const placeholder = list.querySelector('.my-auto');
            if (placeholder) list.innerHTML = '';

            list.appendChild(msgDiv);
            list.scrollTop = list.scrollHeight;

            if (newMsg.receiver_id === myId && !newMsg.lu) {
              await getMessages(adminId);
            }
          }
        }
      });

    } else if (activeTab === 'profile') {
      const user = store.getState().user;

      space.innerHTML = `
        <div class="glass-panel border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
          <div class="border-b border-white/10 pb-4">
            <span class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Mon Compte</span>
            <h3 class="text-xl font-black text-white font-display uppercase tracking-tight mt-0.5">Paramètres du Profil</h3>
          </div>
          
          <form id="profile-edit-form" class="space-y-6">
            
            <!-- Avatar Upload Row -->
            <div class="flex items-center gap-6 flex-wrap md:flex-nowrap border-b border-white/10 pb-6">
              <img id="profile-edit-avatar-preview" src="${user.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}" class="w-16 h-16 rounded-full object-cover border-2 border-suv-gold/50 shadow-lg" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'">
              
              <div class="space-y-2 text-left">
                <label class="block text-xs font-black uppercase tracking-wider text-white/60">Photo de Profil</label>
                <div class="flex items-center gap-3">
                  <input type="file" id="profile-avatar-file-input" accept="image/*" class="hidden">
                  <button type="button" id="select-avatar-btn" class="btn-premium-dark text-xs font-bold px-4 py-2.5 rounded-xl transition-colors">
                    Changer l'image
                  </button>
                  <span class="text-[10px] text-white/40 font-medium">JPEG, PNG max 5 Mo</span>
                </div>
              </div>
            </div>

            <!-- Form Fields -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Prénom</label>
                <input type="text" id="prof-prenom" value="${user.prenom || ''}" class="w-full suv-input text-xs font-semibold" required>
              </div>
              
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Nom</label>
                <input type="text" id="prof-nom" value="${user.nom || ''}" class="w-full suv-input text-xs font-semibold" required>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Téléphone WhatsApp</label>
                <input type="tel" id="prof-telephone" value="${user.telephone || ''}" placeholder="+229 01 00 00 00 00" class="w-full suv-input text-xs font-semibold" required>
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase tracking-widest text-white/40">Email (Lecture Seule)</label>
                <input type="email" value="${user.email || ''}" disabled class="w-full suv-input opacity-50 cursor-not-allowed text-xs font-semibold">
              </div>
            </div>

            <!-- Submit -->
            <div class="text-right pt-4 border-t border-white/10">
              <button type="submit" id="save-profile-btn" class="btn-premium-gold px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-lg">
                Enregistrer les Modifications
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

      if (avatarBtn && avatarInput) {
        avatarBtn.addEventListener('click', () => avatarInput.click());
      }

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
            alert('Photo sélectionnée avec succès.');
          } catch (err) {
            console.error(err);
            alert('Erreur: ' + err.message);
          } finally {
            avatarBtn.textContent = 'Changer l\'image';
            avatarBtn.disabled = false;
          }
        });
      }

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
            
            const headerAvatar = document.getElementById('dashboard-header-avatar');
            if (headerAvatar && uploadedAvatarUrl) {
              headerAvatar.setAttribute('src', uploadedAvatarUrl);
            }
            alert('Votre profil a été mis à jour.');
          } catch (err) {
            console.error(err);
            alert('Erreur: ' + err.message);
          } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = 'Enregistrer les Modifications';
          }
        });
      }

    }
  } catch (err) {
    console.error('Workspace draw failed:', err);
    space.innerHTML = `<div class="text-center py-12 text-rose-400">Erreur lors de l'affichage de l'espace.</div>`;
  }
}
