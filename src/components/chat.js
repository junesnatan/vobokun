import { sendMessage, getMessages, subscribeToMessages, subscribeToTyping, broadcastTyping, uploadVoiceNote } from '../services/messages.js';
import { getAdminUserId } from '../services/auth.js';
import { store } from '../store.js';
import { isMock } from '../firebase.js';
import { AudioRecorder } from '../services/audioRecorder.js';

let activeSubscriptionUnsubscribe = null;
let activeTypingUnsubscribe = null;
let currentVehicleContext = null;

// Programmatically play custom luxury audio player and highlight waveform
export function renderAudioPlayer(audioUrl, msgId) {
  const barCount = 18;
  const barsHTML = Array.from({ length: barCount })
    .map(() => {
      const height = Math.round(10 + Math.random() * 18); // 10px to 28px
      return `<span class="waveform-bar d-inline-block rounded-pill" style="width: 3px; height: ${height}px; background: rgba(235, 10, 30, 0.3);"></span>`;
    })
    .join('');

  return `
    <div class="voice-note-player d-flex align-items-center gap-2 p-2 bg-white bg-opacity-75 rounded-3 border my-1 text-start" style="min-width: 190px; max-width: 100%;" data-audio-url="${audioUrl}">
      <button type="button" class="voice-play-btn btn btn-danger rounded-circle p-0 d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm" style="width: 32px; height: 32px;">
        <i class="bi bi-play-fill play-icon text-white fs-6" style="margin-left: 2px;"></i>
        <i class="bi bi-pause-fill pause-icon text-white fs-6 d-none"></i>
      </button>
      <div class="flex-grow-1 d-flex flex-column gap-1 overflow-hidden">
        <div class="waveform-container d-flex align-items-end gap-1" style="height: 24px;">
          ${barsHTML}
        </div>
        <div class="d-flex align-items-center justify-content-between small text-muted" style="font-size: 0.65rem;">
          <span class="voice-time-elapsed">0:00</span>
          <span class="voice-time-duration">--:--</span>
        </div>
      </div>
    </div>
  `;
}

export function initAudioPlayer(playerEl) {
  if (!playerEl) return;
  const audioUrl = playerEl.getAttribute('data-audio-url');
  const playBtn = playerEl.querySelector('.voice-play-btn');
  const playIcon = playerEl.querySelector('.play-icon');
  const pauseIcon = playerEl.querySelector('.pause-icon');
  const timeElapsed = playerEl.querySelector('.voice-time-elapsed');
  const timeDuration = playerEl.querySelector('.voice-time-duration');
  const waveformBars = playerEl.querySelectorAll('.waveform-container span');

  let audio = null;
  let isPlaying = false;

  const formatAudioTime = (time) => {
    if (isNaN(time)) return '0:00';
    const m = Math.floor(time / 60);
    const s = Math.floor(time % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  playBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();

    if (!audio) {
      audio = new Audio(audioUrl);
      
      audio.addEventListener('loadedmetadata', () => {
        timeDuration.textContent = formatAudioTime(audio.duration);
      });

      audio.addEventListener('timeupdate', () => {
        timeElapsed.textContent = formatAudioTime(audio.currentTime);
        const percent = audio.currentTime / audio.duration;
        const highlightedCount = Math.floor(percent * waveformBars.length);
        waveformBars.forEach((bar, idx) => {
          if (idx <= highlightedCount) {
            bar.style.background = 'var(--toyota-red)';
          } else {
            bar.style.background = 'rgba(235, 10, 30, 0.3)';
          }
        });
      });

      audio.addEventListener('ended', () => {
        isPlaying = false;
        playIcon.classList.remove('d-none');
        pauseIcon.classList.add('d-none');
        timeElapsed.textContent = '0:00';
        waveformBars.forEach(bar => {
          bar.style.background = 'rgba(235, 10, 30, 0.3)';
        });
      });
    }

    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      playIcon.classList.remove('d-none');
      pauseIcon.classList.add('d-none');
    } else {
      window.dispatchEvent(new CustomEvent('suv_audio_play', { detail: { currentAudio: audio } }));
      audio.play().catch(err => console.warn('Audio playback error:', err));
      isPlaying = true;
      playIcon.classList.add('d-none');
      pauseIcon.classList.remove('d-none');
    }
  });

  const handleAudioPlay = (e) => {
    if (audio && e.detail.currentAudio !== audio && isPlaying) {
      audio.pause();
      isPlaying = false;
      playIcon.classList.remove('d-none');
      pauseIcon.classList.add('d-none');
    }
  };
  window.addEventListener('suv_audio_play', handleAudioPlay);
}

export function updateChatVehicleContext(vehicle) {
  currentVehicleContext = vehicle;
  
  const contextBar = document.getElementById('chat-vehicle-context-bar');
  if (contextBar) {
    if (vehicle) {
      const currency = localStorage.getItem('suv_site_currency') || 'FCFA';
      const formattedPrice = new Intl.NumberFormat('fr-FR').format(vehicle.prix) + ' ' + currency;
      contextBar.innerHTML = `
        <div class="d-flex align-items-center gap-2 small">
          <span class="text-muted">Sujet :</span>
          <span class="fw-bold text-dark text-truncate" style="max-width: 170px;">${vehicle.marque} ${vehicle.modele}</span>
        </div>
        <span class="badge bg-danger text-white">${formattedPrice}</span>
      `;
      contextBar.classList.remove('d-none');
      contextBar.classList.add('d-flex');
    } else {
      contextBar.innerHTML = '';
      contextBar.classList.add('d-none');
      contextBar.classList.remove('d-flex');
    }
  }
  
  // Pre-fill input if empty and there's a vehicle
  const input = document.getElementById('chat-text-input');
  if (input && vehicle && !input.value.trim()) {
    input.value = `Bonjour, je suis intéressé par le SUV ${vehicle.marque} ${vehicle.modele}. Est-il disponible ?`;
  }
}

export function renderFloatingChat(vehicleContext = null) {
  const state = store.getState();
  if (!state.user || state.user.role === 'admin') return '';

  return `
    <!-- Floating Chat Widget -->
    <div id="floating-chat-container" class="position-fixed bottom-0 end-0 m-4 d-flex flex-column align-items-end" style="z-index: 1045;">
      
      <!-- Collapsed Bubble -->
      <button id="chat-toggle-bubble" class="btn btn-toyota-red rounded-circle d-flex align-items-center justify-content-center shadow-lg position-relative" style="width: 56px; height: 56px;" title="Contacter un conseiller">
        <i class="bi bi-chat-dots-fill fs-4 text-white"></i>
        <span id="chat-badge" class="position-absolute top-0 end-0 badge rounded-pill bg-dark border border-white text-white d-none" style="font-size: 0.7rem;">0</span>
      </button>
 
      <!-- Chat Box Panel (Hidden by default) -->
      <div id="chat-box-panel" class="toyota-panel rounded-4 shadow-2xl p-0 overflow-hidden d-none flex-column mb-3 text-start border" style="width: 360px; height: 490px; max-width: calc(100vw - 32px);">
        
        <!-- Chat Header -->
        <div class="px-3 py-3 d-flex align-items-center justify-content-between text-white" style="background: var(--toyota-red);">
          <div class="d-flex align-items-center gap-2">
            <div class="position-relative">
              <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Conseiller" class="rounded-circle object-fit-cover border border-white" style="width: 36px; height: 36px;">
              <span class="position-absolute bottom-0 end-0 rounded-circle bg-success border border-white" style="width: 10px; height: 10px;"></span>
            </div>
            <div>
              <h6 class="small fw-black text-white text-uppercase font-display mb-0">Conseiller Vobokun</h6>
              <span class="text-white-50 small" style="font-size: 0.65rem;">Showroom Direct VIP</span>
            </div>
          </div>
          <button id="chat-close-btn" class="btn btn-sm btn-outline-light rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 30px; height: 30px;">
            <i class="bi bi-x-lg" style="font-size: 0.8rem;"></i>
          </button>
        </div>

        <!-- Vehicle Context Bar -->
        <div id="chat-vehicle-context-bar" class="d-none bg-light border-bottom px-3 py-2 align-items-center justify-content-between gap-2"></div>

        <!-- Message List -->
        <div id="chat-messages-list" class="flex-grow-1 p-3 overflow-y-auto d-flex flex-column gap-2" style="background: #FAFBFD;">
          <div class="text-center py-5 text-muted small">Chargement de la conversation...</div>
        </div>

        <!-- Typing Indicator -->
        <div id="chat-typing-indicator" class="d-none bg-light px-3 py-1 small text-muted fst-italic align-items-center gap-2 border-top" style="font-size: 0.75rem;">
          <div class="spinner-grow spinner-grow-sm text-danger" style="width: 0.65rem; height: 0.65rem;" role="status"></div>
          <span>Le conseiller écrit...</span>
        </div>

        <!-- Input Box -->
        <form id="chat-input-form" class="p-2 bg-light border-top d-flex align-items-center gap-2 position-relative">
          <!-- Text Input Container -->
          <div id="chat-input-text-container" class="flex-grow-1 d-flex align-items-center gap-2">
            <input type="text" id="chat-text-input" placeholder="Écrivez votre message..." class="form-control form-control-sm toyota-input" required autocomplete="off">
            <button type="button" id="chat-mic-btn" class="btn btn-sm btn-outline-secondary rounded-3" title="Enregistrer une note vocale">
              <i class="bi bi-mic"></i>
            </button>
          </div>

          <!-- Recording State Container -->
          <div id="chat-input-recording-container" class="d-none flex-grow-1 d-flex align-items-center justify-content-between bg-danger-subtle rounded-3 px-2 py-1 border border-danger-subtle">
            <div class="d-flex align-items-center gap-2">
              <span class="rounded-circle bg-danger d-inline-block animate-pulse" style="width: 8px; height: 8px;"></span>
              <span class="small text-danger fw-bold font-monospace" id="chat-recording-timer">0:00</span>
              <span class="small text-secondary" style="font-size: 0.7rem;">Enregistrement...</span>
            </div>
            <div class="d-flex align-items-center gap-1">
              <button type="button" id="chat-cancel-record-btn" class="btn btn-sm btn-link text-muted p-1" title="Annuler">
                <i class="bi bi-trash3 text-danger"></i>
              </button>
              <button type="button" id="chat-send-record-btn" class="btn btn-sm btn-danger rounded-circle p-1 d-flex align-items-center justify-content-center" style="width: 28px; height: 28px;" title="Envoyer la note vocale">
                <i class="bi bi-arrow-up text-white"></i>
              </button>
            </div>
          </div>

          <!-- Submit Text Button -->
          <button type="submit" id="chat-submit-btn" class="btn btn-toyota-red btn-sm rounded-3 px-3">
            <i class="bi bi-send-fill text-white"></i>
          </button>
        </form>

      </div>
    </div>
  `;
}

export function initFloatingChat(vehicleContext = null) {
  const bubble = document.getElementById('chat-toggle-bubble');
  const panel = document.getElementById('chat-box-panel');
  const closeBtn = document.getElementById('chat-close-btn');
  const form = document.getElementById('chat-input-form');
  const input = document.getElementById('chat-text-input');
  const list = document.getElementById('chat-messages-list');
  const badge = document.getElementById('chat-badge');

  if (!bubble || !panel) return;

  if (vehicleContext) {
    currentVehicleContext = vehicleContext;
  }

  const runInit = async () => {
    let adminId = 'admin-id';
    const fetchedAdminId = await getAdminUserId();
    if (fetchedAdminId) {
      adminId = fetchedAdminId;
    }

    // Open Chat
    const openChat = async () => {
      panel.classList.remove('d-none');
      panel.classList.add('d-flex');
      bubble.classList.add('d-none');
      
      // Fetch initial history
      await loadMessages();
      
      // Clear badge
      badge.textContent = '0';
      badge.classList.add('d-none');
      store.updateUnreadCount();

      // Update context bar in UI
      if (currentVehicleContext) {
        updateChatVehicleContext(currentVehicleContext);
      }
    };

    // Close Chat
    const closeChat = () => {
      panel.classList.add('d-none');
      panel.classList.remove('d-flex');
      bubble.classList.remove('d-none');
    };

    bubble.addEventListener('click', openChat);
    if (closeBtn) closeBtn.addEventListener('click', closeChat);

    // Load message log from DB
    const loadMessages = async () => {
      if (!list) return;

      try {
        const { data: messages } = await getMessages(adminId);
        renderMessages(messages);
      } catch (e) {
        console.error('Error loading chat messages:', e);
        list.innerHTML = `<div class="text-center py-4 small text-danger">Erreur de chargement des messages</div>`;
      }
    };

    // Render messages in DOM
    const renderMessages = (messages) => {
      if (!list) return;

      if (messages.length === 0) {
        list.innerHTML = `
          <div class="text-center py-5 text-muted small my-auto">
            <i class="bi bi-chat-quote fs-3 text-secondary d-block mb-2"></i>
            <p class="mb-1 fw-bold">Aucun message. Entamez la discussion !</p>
            <p class="small text-muted mb-0">Votre conseiller vous répondra sous quelques minutes.</p>
          </div>
        `;
        return;
      }

      const currentUserId = store.getState().user?.id;

      list.innerHTML = messages.map(msg => {
        const isSelf = msg.sender_id === currentUserId;
        const bgClass = isSelf ? 'btn-toyota-red text-white align-self-end rounded-4 rounded-bottom-end-0 shadow-sm' : 'bg-white text-dark border align-self-start rounded-4 rounded-bottom-start-0 shadow-sm';
        const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        const isAudio = msg.contenu && msg.contenu.startsWith('[audio]:');
        const contentHtml = isAudio 
          ? renderAudioPlayer(msg.contenu.substring(8), msg.id) 
          : `<span>${msg.contenu}</span>`;

        return `
          <div class="p-3 small lh-base ${bgClass} d-flex flex-column" style="max-width: 82%;" data-msg-id="${msg.id || ''}">
            ${contentHtml}
            <span class="opacity-75 align-self-end mt-1 font-monospace" style="font-size: 0.65rem;">${time}</span>
          </div>
        `;
      }).join('');

      // Initialize all voice note players in the list
      list.querySelectorAll('.voice-note-player').forEach(playerEl => {
        initAudioPlayer(playerEl);
      });

      // Scroll to bottom
      list.scrollTop = list.scrollHeight;
    };

    // Submit new message
    if (form) {
      // Remove previous listener to avoid double submissions
      const newForm = form.cloneNode(true);
      form.parentNode.replaceChild(newForm, form);
      
      const newInput = newForm.querySelector('#chat-text-input');
      const micBtn = newForm.querySelector('#chat-mic-btn');
      const textContainer = newForm.querySelector('#chat-input-text-container');
      const recordingContainer = newForm.querySelector('#chat-input-recording-container');
      const recordingTimer = newForm.querySelector('#chat-recording-timer');
      const cancelRecordBtn = newForm.querySelector('#chat-cancel-record-btn');
      const sendRecordBtn = newForm.querySelector('#chat-send-record-btn');
      const submitBtn = newForm.querySelector('#chat-submit-btn');

      let recorder = null;
      let typingTimeout = null;
      let isCurrentlyTyping = false;

      newInput.addEventListener('input', () => {
        const myId = store.getState().user?.id;
        if (!myId) return;

        if (!isCurrentlyTyping) {
          isCurrentlyTyping = true;
          broadcastTyping(myId, true);
        }

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          isCurrentlyTyping = false;
          broadcastTyping(myId, false);
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
            textContainer.classList.add('d-none');
            submitBtn.classList.add('d-none');
            recordingContainer.classList.remove('d-none');
            recordingContainer.classList.add('d-flex');
            newInput.required = false;

            const myId = store.getState().user?.id;
            if (myId) {
              broadcastTyping(myId, 'recording');
            }

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
          newInput.required = true;
          if (recordingTimer) recordingTimer.textContent = '0:00';

          const myId = store.getState().user?.id;
          if (myId) {
            broadcastTyping(myId, false);
          }
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
          const bgClass = 'btn-toyota-red text-white align-self-end rounded-4 rounded-bottom-end-0 opacity-75';
          const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          const localAudioUrl = URL.createObjectURL(audioBlob);

          const msgDiv = document.createElement('div');
          msgDiv.className = `p-3 small lh-base ${bgClass} shadow-sm d-flex flex-column`;
          msgDiv.style.maxWidth = '82%';
          msgDiv.setAttribute('data-msg-id', tempId);
          msgDiv.setAttribute('data-pending', 'true');
          msgDiv.innerHTML = `
            ${renderAudioPlayer(localAudioUrl, tempId)}
            <span class="opacity-75 align-self-end mt-1 font-monospace d-flex align-items-center gap-1" style="font-size: 0.65rem;">
              ${time}
              <div class="spinner-border spinner-border-sm text-white" style="width: 0.6rem; height: 0.6rem;" role="status"></div>
            </span>
          `;

          const placeholder = list.querySelector('.my-auto');
          if (placeholder) {
            list.innerHTML = '';
          }

          list.appendChild(msgDiv);
          list.scrollTop = list.scrollHeight;

          const tempPlayerEl = msgDiv.querySelector('.voice-note-player');
          if (tempPlayerEl) {
            initAudioPlayer(tempPlayerEl);
          }

          try {
            const voiceUrl = await uploadVoiceNote(audioBlob);
            const contenu = `[audio]:${voiceUrl}`;
            const vehicleId = currentVehicleContext ? currentVehicleContext.id : null;
            
            const { data: sentMsg, error } = await sendMessage(adminId, contenu, vehicleId);
            if (error) throw error;

            if (sentMsg) {
              const existingTemp = list.querySelector(`[data-msg-id="${tempId}"]`);
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
            }
          } catch (err) {
            console.error('Failed to send voice note:', err);
            const existingTemp = list.querySelector(`[data-msg-id="${tempId}"]`);
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
      
      newForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const txt = newInput.value.trim();
        if (!txt) return;

        // Clear typing status
        clearTimeout(typingTimeout);
        isCurrentlyTyping = false;
        const myId = store.getState().user?.id;
        if (myId) {
          broadcastTyping(myId, false);
        }

        newInput.value = '';
        newInput.focus();

        // 1. Generate temp ID and append optimistically
        const tempId = 'msg-temp-' + Date.now();
        const bgClass = 'btn-toyota-red text-white align-self-end rounded-4 rounded-bottom-end-0 opacity-75';
        const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const msgDiv = document.createElement('div');
        msgDiv.className = `p-3 small lh-base ${bgClass} shadow-sm d-flex flex-column`;
        msgDiv.style.maxWidth = '82%';
        msgDiv.setAttribute('data-msg-id', tempId);
        msgDiv.setAttribute('data-pending', 'true');
        msgDiv.innerHTML = `
          <span>${txt}</span>
          <span class="opacity-75 align-self-end mt-1 font-monospace d-flex align-items-center gap-1" style="font-size: 0.65rem;">
            ${time}
            <div class="spinner-border spinner-border-sm text-white" style="width: 0.6rem; height: 0.6rem;" role="status"></div>
          </span>
        `;
        
        const placeholder = list.querySelector('.my-auto');
        if (placeholder) {
          list.innerHTML = '';
        }

        list.appendChild(msgDiv);
        list.scrollTop = list.scrollHeight;

        try {
          const vehicleId = currentVehicleContext ? currentVehicleContext.id : null;
          const { data: sentMsg, error } = await sendMessage(adminId, txt, vehicleId);
          
          if (error) throw error;

          if (sentMsg) {
            const existingTemp = list.querySelector(`[data-msg-id="${tempId}"]`);
            if (existingTemp) {
              existingTemp.setAttribute('data-msg-id', sentMsg.id);
              existingTemp.removeAttribute('data-pending');
              existingTemp.classList.remove('opacity-75');
              const timeSpan = existingTemp.querySelector('span:last-child');
              if (timeSpan) {
                timeSpan.innerHTML = new Date(sentMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              }
            }
          }
        } catch (err) {
          console.error('Failed to send message:', err);
          const existingTemp = list.querySelector(`[data-msg-id="${tempId}"]`);
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

    // Subscribe to real-time messages
    if (activeSubscriptionUnsubscribe) {
      activeSubscriptionUnsubscribe();
    }

    activeSubscriptionUnsubscribe = subscribeToMessages(async (newMsg) => {
      const state = store.getState();
      const currentUserId = state.user?.id;

      const isRelevant = 
        (newMsg.sender_id === adminId && newMsg.receiver_id === currentUserId) ||
        (newMsg.sender_id === currentUserId && newMsg.receiver_id === adminId);

      if (isRelevant) {
        const existing = list.querySelector(`[data-msg-id="${newMsg.id}"]`);
        if (!existing) {
          const isSelf = newMsg.sender_id === currentUserId;
          
          if (isSelf) {
            const pendingEl = Array.from(list.querySelectorAll('[data-pending="true"]')).find(el => {
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

          const bgClass = isSelf ? 'btn-toyota-red text-white align-self-end rounded-4 rounded-bottom-end-0' : 'bg-white text-dark border align-self-start rounded-4 rounded-bottom-start-0';
          const time = new Date(newMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

          const msgDiv = document.createElement('div');
          msgDiv.className = `p-3 small lh-base ${bgClass} shadow-sm d-flex flex-column`;
          msgDiv.style.maxWidth = '82%';
          msgDiv.setAttribute('data-msg-id', newMsg.id || '');
          
          const isAudio = newMsg.contenu && newMsg.contenu.startsWith('[audio]:');
          const contentHtml = isAudio 
            ? renderAudioPlayer(newMsg.contenu.substring(8), newMsg.id) 
            : `<span>${newMsg.contenu}</span>`;

          msgDiv.innerHTML = `
            ${contentHtml}
            <span class="opacity-75 align-self-end mt-1 font-monospace" style="font-size: 0.65rem;">${time}</span>
          `;
          
          const placeholder = list.querySelector('.my-auto');
          if (placeholder) {
            list.innerHTML = '';
          }

          list.appendChild(msgDiv);
          list.scrollTop = list.scrollHeight;
          
          if (isAudio) {
            const playerEl = msgDiv.querySelector('.voice-note-player');
            if (playerEl) {
              initAudioPlayer(playerEl);
            }
          }

          if (newMsg.receiver_id === currentUserId && !newMsg.lu) {
            await getMessages(adminId);
          }
        }
        
        if (panel.classList.contains('d-none') && newMsg.sender_id === adminId) {
          const currentCount = parseInt(badge.textContent) || 0;
          const newCount = currentCount + 1;
          badge.textContent = newCount.toString();
          badge.classList.remove('d-none');
          store.updateUnreadCount();
        }
      }
    });

    // Subscribe to typing indicator
    if (activeTypingUnsubscribe) {
      activeTypingUnsubscribe();
    }
    
    const typingIndicator = panel.querySelector('#chat-typing-indicator');
    const myUserId = store.getState().user?.id;
    if (myUserId) {
      activeTypingUnsubscribe = subscribeToTyping(myUserId, (payload) => {
        if (payload.sender_id === adminId) {
          if (payload.isTyping) {
            if (typingIndicator) {
              const typingText = typingIndicator.querySelector('span:last-child');
              if (typingText) {
                typingText.textContent = payload.typingState === 'recording' 
                  ? 'Le conseiller enregistre un audio...' 
                  : 'Le conseiller écrit...';
              }
              typingIndicator.classList.remove('d-none');
              typingIndicator.classList.add('d-flex');
              list.scrollTop = list.scrollHeight;
            }
          } else {
            if (typingIndicator) {
              typingIndicator.classList.add('d-none');
              typingIndicator.classList.remove('d-flex');
            }
          }
        }
      });
    }
  };

  runInit();
}
