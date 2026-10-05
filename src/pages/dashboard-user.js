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
      <div class="container py-5 text-center my-4">
        <div class="rounded-3 d-inline-flex align-items-center justify-content-center text-white fw-black fs-2 shadow-sm mb-3" style="width: 60px; height: 60px; background: var(--toyota-red);">V</div>
        <h2 class="fw-black text-dark font-display text-uppercase mb-2">Espace Client Vobokun</h2>
        <p class="small text-muted max-w-md mx-auto mb-4">Connectez-vous pour retrouver vos véhicules favoris, suivre vos négociations et discuter avec nos conseillers showroom.</p>
        <div>
          <a href="/login" class="btn btn-toyota-red px-4 py-3 fw-black text-uppercase shadow-sm" data-link>
            Se Connecter / S'inscrire
          </a>
        </div>
      </div>
    `;
  }

  const avatar = user.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80';

  return `
    <div class="container py-4 text-start">
      
      <!-- Profile Header Summary Banner -->
      <div class="toyota-panel rounded-4 p-4 p-md-5 mb-4 shadow-sm border d-flex flex-column flex-md-row align-items-center justify-content-between gap-4">
        
        <div class="d-flex align-items-center gap-4 text-center text-md-start flex-column flex-md-row">
          <div class="position-relative cursor-pointer" id="header-avatar-container" title="Modifier mon profil" style="cursor: pointer;">
            <img id="dashboard-header-avatar" src="${avatar}" alt="${user.prenom}" class="rounded-circle object-fit-cover border border-danger shadow-sm" style="width: 80px; height: 80px;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'">
            <div class="position-absolute bottom-0 end-0 rounded-circle text-white d-flex align-items-center justify-content-center shadow-sm" style="width: 26px; height: 26px; background: var(--toyota-red);">
              <i class="bi bi-camera-fill" style="font-size: 0.75rem;"></i>
            </div>
          </div>
          <div>
            <div class="d-flex align-items-center justify-content-center justify-content-md-start gap-2">
              <h2 class="h3 fw-black text-dark font-display text-uppercase mb-0">${user.prenom} ${user.nom}</h2>
              <span class="badge bg-danger text-white text-uppercase" style="font-size: 0.65rem;">VIP</span>
            </div>
            <p class="small text-muted mb-0 mt-1">Espace Client Vobokun &middot; Membre depuis ${new Date(user.created_at || Date.now()).toLocaleDateString('fr-FR')}</p>
          </div>
        </div>

        <div class="d-flex flex-wrap align-items-center gap-2 small">
          <span class="badge bg-light text-secondary border p-2 px-3 fw-bold">Tél : ${user.telephone || 'Non renseigné'}</span>
          <span class="badge bg-danger-subtle text-danger border border-danger-subtle p-2 px-3 fw-black text-uppercase">${user.role === 'admin' ? 'Admin' : 'Client Privilège'}</span>
        </div>
      </div>

      <!-- Dashboard Grid: Sidebar & Workspace -->
      <div class="row g-4 align-items-start">
        
        <!-- Sidebar Navigation Tabs -->
        <nav class="col-lg-3">
          <div class="toyota-panel rounded-4 p-2 p-lg-3 shadow-sm border d-flex flex-row flex-lg-column overflow-x-auto no-scrollbar brand-scroll-track gap-2 mb-3 mb-lg-0">
            
            <button data-tab="favorites" class="tab-btn btn ${activeTab === 'favorites' ? 'btn-toyota-red' : 'btn-light text-secondary'} text-start px-3 py-2 py-lg-3 rounded-3 small fw-bold text-uppercase d-flex align-items-center gap-2 flex-shrink-0 flex-lg-shrink-1 text-nowrap" style="font-size: 0.75rem;">
              <i class="bi bi-heart fs-6"></i>
              <span>Mes Favoris</span>
            </button>
            
            <button data-tab="offers" class="tab-btn btn ${activeTab === 'offers' ? 'btn-toyota-red' : 'btn-light text-secondary'} text-start px-3 py-2 py-lg-3 rounded-3 small fw-bold text-uppercase d-flex align-items-center gap-2 flex-shrink-0 flex-lg-shrink-1 text-nowrap" style="font-size: 0.75rem;">
              <i class="bi bi-tag fs-6"></i>
              <span>Mes Négociations</span>
            </button>
            
            <button data-tab="chat" class="tab-btn btn ${activeTab === 'chat' ? 'btn-toyota-red' : 'btn-light text-secondary'} text-start px-3 py-2 py-lg-3 rounded-3 small fw-bold text-uppercase d-flex align-items-center justify-content-between gap-2 flex-shrink-0 flex-lg-shrink-1 text-nowrap position-relative" style="font-size: 0.75rem;">
              <div class="d-flex align-items-center gap-2">
                <i class="bi bi-chat-dots fs-6"></i>
                <span>Messagerie Directe</span>
              </div>
              <span id="inbox-badge" class="badge rounded-pill bg-danger text-white d-none ms-1" style="font-size: 0.65rem;">0</span>
            </button>
            
            <button data-tab="profile" class="tab-btn btn ${activeTab === 'profile' ? 'btn-toyota-red' : 'btn-light text-secondary'} text-start px-3 py-2 py-lg-3 rounded-3 small fw-bold text-uppercase d-flex align-items-center gap-2 flex-shrink-0 flex-lg-shrink-1 text-nowrap" style="font-size: 0.75rem;">
              <i class="bi bi-person fs-6"></i>
              <span>Mon Profil</span>
            </button>

          </div>
        </nav>

        <!-- Main Workspace Pane -->
        <main class="col-lg-9" id="dashboard-workspace">
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
        btn.className = "tab-btn btn btn-toyota-red text-start px-3 py-2 py-lg-3 rounded-3 small fw-bold text-uppercase d-flex align-items-center gap-2 flex-shrink-0 flex-lg-shrink-1 text-nowrap shadow-sm";
      } else {
        btn.className = "tab-btn btn btn-light text-secondary text-start px-3 py-2 py-lg-3 rounded-3 small fw-bold text-uppercase d-flex align-items-center gap-2 flex-shrink-0 flex-lg-shrink-1 text-nowrap";
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
      btn.className = "tab-btn btn btn-toyota-red text-start px-3 py-2 py-lg-3 rounded-3 small fw-bold text-uppercase d-flex align-items-center gap-2 flex-shrink-0 flex-lg-shrink-1 text-nowrap shadow-sm";
    } else {
      btn.className = "tab-btn btn btn-light text-secondary text-start px-3 py-2 py-lg-3 rounded-3 small fw-bold text-uppercase d-flex align-items-center gap-2 flex-shrink-0 flex-lg-shrink-1 text-nowrap";
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
        inboxBadge.classList.remove('d-none');
      } else {
        inboxBadge.classList.add('d-none');
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

  space.innerHTML = `
    <div class="text-center py-5 text-muted">
      <div class="spinner-border text-danger mb-3" role="status"></div>
      <p class="small fw-semibold">Chargement instantané...</p>
    </div>
  `;

  try {
    if (activeTab === 'favorites') {
      const { data: favorites } = await getFavorites();
      
      if (favorites.length === 0) {
        space.innerHTML = `
          <div class="toyota-panel rounded-4 p-5 text-center shadow-sm border">
            <div class="rounded-circle bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mb-3" style="width: 56px; height: 56px;">
              <i class="bi bi-heart fs-3"></i>
            </div>
            <h4 class="fw-black text-dark font-display text-uppercase mb-2">Aucun favori enregistré</h4>
            <p class="small text-muted max-w-sm mx-auto mb-4">Parcourez le showroom et cliquez sur le cœur pour sauvegarder vos SUV préférés.</p>
            <a href="/catalogue" class="btn btn-toyota-red px-4 py-2 fw-bold text-uppercase" data-link>Découvrir les SUV</a>
          </div>
        `;
        return;
      }

      space.innerHTML = `
        <div class="row g-4" id="fav-dashboard-grid">
          ${favorites.map(v => `
            <div class="col-12 col-md-6 col-xl-4">
              ${renderVehicleCard(v, true)}
            </div>
          `).join('')}
        </div>
      `;
      initVehicleCards(document.getElementById('fav-dashboard-grid'));

    } else if (activeTab === 'offers') {
      const { data: offers } = await getUserOffers();

      if (offers.length === 0) {
        space.innerHTML = `
          <div class="toyota-panel rounded-4 p-5 text-center shadow-sm border">
            <div class="rounded-circle bg-danger-subtle text-danger d-inline-flex align-items-center justify-content-center mb-3" style="width: 56px; height: 56px;">
              <i class="bi bi-tag fs-3"></i>
            </div>
            <h4 class="fw-black text-dark font-display text-uppercase mb-2">Aucune négociation en cours</h4>
            <p class="small text-muted max-w-sm mx-auto mb-4">Lorsque vous soumettez une offre de prix sur un véhicule, elle s'affiche ici avec son statut en temps réel.</p>
            <a href="/catalogue" class="btn btn-toyota-red px-4 py-2 fw-bold text-uppercase" data-link>Voir les véhicules</a>
          </div>
        `;
        return;
      }

      const offersHTML = offers.map(o => {
        let statusBadge = '';
        if (o.statut === 'pending') {
          statusBadge = '<span class="badge bg-warning-subtle text-warning border border-warning-subtle px-3 py-2 fw-bold text-uppercase">En attente</span>';
        } else if (o.statut === 'accepted') {
          statusBadge = '<span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 fw-bold text-uppercase">Offre Acceptée</span>';
        } else if (o.statut === 'refused') {
          statusBadge = '<span class="badge bg-danger-subtle text-danger border border-danger-subtle px-3 py-2 fw-bold text-uppercase">Déclinée</span>';
        } else {
          statusBadge = '<span class="badge bg-info-subtle text-info border border-info-subtle px-3 py-2 fw-bold text-uppercase">En Négociation</span>';
        }

        const priceHTML = o.prix_propose 
          ? `<p class="small text-muted mb-0">Offre proposée : <span class="text-danger fw-black font-display">${new Intl.NumberFormat('fr-FR').format(o.prix_propose)} ${currency}</span></p>`
          : '<p class="small text-muted mb-0">Demande d\'information générale</p>';

        const vehicleTitle = o.vehicle 
          ? `<a href="/vehicle/${o.vehicle.id}" class="h5 fw-black text-dark text-decoration-none hover-danger font-display text-uppercase mb-1 d-block" data-link>${o.vehicle.marque} ${o.vehicle.modele} (${o.vehicle.annee})</a>`
          : '<span class="h5 fw-bold text-secondary mb-1 d-block">Modèle archivé</span>';

        return `
          <div class="toyota-panel rounded-4 p-4 border mb-3 shadow-sm">
            <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap pb-3 border-bottom">
              <div>
                ${vehicleTitle}
                ${priceHTML}
              </div>
              <div>${statusBadge}</div>
            </div>

            <div class="p-3 rounded-3 my-3 small border" style="background: #F4F5F8;">
              <span class="small fw-bold text-uppercase text-danger d-block mb-1" style="font-size: 0.7rem;">Votre message :</span>
              <p class="text-secondary mb-0">${o.message}</p>
            </div>

            ${o.note_admin ? `
              <div class="p-3 rounded-3 mb-3 small border border-danger-subtle" style="background: rgba(235, 10, 30, 0.04);">
                <span class="small fw-bold text-uppercase text-danger d-block mb-1" style="font-size: 0.7rem;">Réponse du Concessionnaire :</span>
                <p class="text-dark fw-semibold mb-0">${o.note_admin}</p>
              </div>
            ` : ''}

            ${o.statut === 'in_progress' ? `
              <div class="d-flex gap-2 pt-2" data-offer-id="${o.id}">
                <button class="client-accept-btn btn btn-success btn-sm fw-bold px-3 py-2 text-uppercase" style="font-size: 0.75rem;">
                  Accepter la contre-proposition
                </button>
                <button class="client-refuse-btn btn btn-danger btn-sm fw-bold px-3 py-2 text-uppercase" style="font-size: 0.75rem;">
                  Refuser
                </button>
              </div>
            ` : ''}

            <div class="small text-muted text-end mt-2" style="font-size: 0.7rem;">
              Soumis le ${new Date(o.created_at).toLocaleDateString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        `;
      }).join('');

      space.innerHTML = `<div>${offersHTML}</div>`;

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
        <div class="toyota-panel rounded-4 shadow-sm border overflow-hidden p-0 d-flex flex-column" style="height: 580px;">
          
          <!-- Chat Box Header -->
          <div class="px-4 py-3 d-flex align-items-center justify-content-between text-white" style="background: var(--toyota-red);">
            <div class="d-flex align-items-center gap-2">
              <div class="position-relative">
                <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Conseiller" class="rounded-circle object-fit-cover border border-white" style="width: 36px; height: 36px;">
                <span class="position-absolute bottom-0 end-0 rounded-circle bg-success border border-white" style="width: 10px; height: 10px;"></span>
              </div>
              <div>
                <h6 class="fw-black text-white text-uppercase font-display mb-0">Conseiller Vobokun</h6>
                <span class="text-white-50 small" style="font-size: 0.7rem;">Showroom Direct VIP</span>
              </div>
            </div>
            <span class="badge bg-black text-white text-uppercase" style="font-size: 0.65rem;">Messagerie Sécurisée</span>
          </div>

          <!-- Messages Container -->
          <div id="dashboard-messages-list" class="flex-grow-1 p-4 overflow-y-auto d-flex flex-column gap-2" style="background: #FAFBFD;">
          </div>

          <!-- Input Form -->
          <form id="dashboard-chat-form" class="p-3 bg-light border-top d-flex gap-2">
            <input type="text" id="dashboard-chat-input" placeholder="Écrivez votre message à notre conseiller..." class="form-control toyota-input flex-grow-1" required autocomplete="off">
            <button type="submit" class="btn btn-toyota-red px-4 fw-black text-uppercase d-flex align-items-center gap-2 shadow-sm" style="font-size: 0.8rem;">
              <span>Envoyer</span>
              <i class="bi bi-send-fill text-white"></i>
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
              <div class="text-center py-5 text-muted small my-auto">
                <div class="rounded-circle bg-light border d-inline-flex align-items-center justify-content-center mb-3" style="width: 52px; height: 52px;">
                  <i class="bi bi-chat-dots fs-4 text-danger"></i>
                </div>
                <h5 class="fw-black text-dark font-display text-uppercase mb-1">Démarrez votre conversation</h5>
                <p class="small text-muted mb-0">Posez vos questions ou négociez le SUV de votre choix.</p>
              </div>
            `;
            return;
          }

          const myId = store.getState().user.id;
          list.innerHTML = messages.map(msg => {
            const isSelf = msg.sender_id === myId;
            const align = isSelf ? 'btn-toyota-red text-white align-self-end rounded-4 rounded-bottom-end-0 shadow-sm' : 'bg-white text-dark border align-self-start rounded-4 rounded-bottom-start-0 shadow-sm';
            const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            return `
              <div class="p-3 small lh-base ${align} d-flex flex-column" style="max-width: 78%;" data-msg-id="${msg.id || ''}">
                <span>${msg.contenu}</span>
                <span class="opacity-75 align-self-end mt-1 font-monospace" style="font-size: 0.65rem;">${time}</span>
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
              msgDiv.className = `p-3 small lh-base btn-toyota-red text-white align-self-end rounded-4 rounded-bottom-end-0 shadow-sm d-flex flex-column`;
              msgDiv.style.maxWidth = '78%';
              msgDiv.setAttribute('data-msg-id', sentMsg.id || '');
              msgDiv.innerHTML = `
                <span>${sentMsg.contenu}</span>
                <span class="opacity-75 align-self-end mt-1 font-monospace" style="font-size: 0.65rem;">${time}</span>
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
            const align = isSelf ? 'btn-toyota-red text-white align-self-end rounded-4 rounded-bottom-end-0 shadow-sm' : 'bg-white text-dark border align-self-start rounded-4 rounded-bottom-start-0 shadow-sm';
            const time = new Date(newMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

            const msgDiv = document.createElement('div');
            msgDiv.className = `p-3 small lh-base ${align} d-flex flex-column`;
            msgDiv.style.maxWidth = '78%';
            msgDiv.setAttribute('data-msg-id', newMsg.id || '');
            msgDiv.innerHTML = `
              <span>${newMsg.contenu}</span>
              <span class="opacity-75 align-self-end mt-1 font-monospace" style="font-size: 0.65rem;">${time}</span>
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
        <div class="toyota-panel rounded-4 p-4 p-md-5 shadow-sm border">
          <div class="border-bottom pb-3 mb-4">
            <span class="badge bg-danger text-white text-uppercase" style="font-size: 0.65rem;">Mon Compte</span>
            <h3 class="h4 fw-black text-dark font-display text-uppercase mt-1 mb-0">Paramètres du Profil</h3>
          </div>
          
          <form id="profile-edit-form">
            
            <!-- Avatar Upload Row -->
            <div class="d-flex align-items-center gap-4 flex-wrap border-bottom pb-4 mb-4">
              <img id="profile-edit-avatar-preview" src="${user.avatar_url || 'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'}" class="rounded-circle object-fit-cover border border-danger shadow-sm" style="width: 72px; height: 72px;" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'">
              
              <div>
                <label class="form-label small fw-bold text-uppercase text-secondary mb-2" style="font-size: 0.75rem;">Photo de Profil</label>
                <div class="d-flex align-items-center gap-2">
                  <input type="file" id="profile-avatar-file-input" accept="image/*" class="d-none">
                  <button type="button" id="select-avatar-btn" class="btn btn-toyota-dark btn-sm fw-bold px-3 py-2">
                    Changer l'image
                  </button>
                  <span class="small text-muted" style="font-size: 0.7rem;">JPEG, PNG max 5 Mo</span>
                </div>
              </div>
            </div>

            <!-- Form Fields -->
            <div class="row g-3">
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Prénom</label>
                <input type="text" id="prof-prenom" value="${user.prenom || ''}" class="form-control toyota-input" required>
              </div>
              
              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Nom</label>
                <input type="text" id="prof-nom" value="${user.nom || ''}" class="form-control toyota-input" required>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-uppercase text-secondary" style="font-size: 0.75rem;">Téléphone WhatsApp</label>
                <input type="tel" id="prof-telephone" value="${user.telephone || ''}" placeholder="+229 01 00 00 00 00" class="form-control toyota-input" required>
              </div>

              <div class="col-12 col-md-6">
                <label class="form-label small fw-bold text-uppercase text-muted" style="font-size: 0.75rem;">Email (Lecture Seule)</label>
                <input type="email" value="${user.email || ''}" disabled class="form-control toyota-input bg-light opacity-75">
              </div>
            </div>

            <!-- Submit -->
            <div class="text-end pt-4 mt-4 border-top">
              <button type="submit" id="save-profile-btn" class="btn btn-toyota-red px-4 py-3 fw-black text-uppercase shadow-sm" style="font-size: 0.8rem;">
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
    space.innerHTML = `<div class="text-center py-5 text-danger">Erreur lors de l'affichage de l'espace.</div>`;
  }
}
