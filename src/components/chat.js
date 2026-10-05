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
      return `<span class="w-0.5 rounded-full bg-white/30" style="height: ${height}px;"></span>`;
    })
    .join('');

  return `
    <div class="voice-note-player flex items-center gap-3 p-2 bg-black/15 border border-white/5 rounded-xl min-w-[200px] max-w-full my-1 text-left" data-audio-url="${audioUrl}">
      <button type="button" class="voice-play-btn w-8 h-8 rounded-full bg-suv-gold text-suv-darker flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200 shadow-md flex-shrink-0">
        <svg class="w-3.5 h-3.5 fill-current ml-0.5 play-icon" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <svg class="w-3.5 h-3.5 fill-current hidden pause-icon" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
      </button>
      <div class="flex-grow flex flex-col gap-1 min-w-0">
        <div class="waveform-container flex items-end gap-[3px] h-7 text-suv-gold/30">
          ${barsHTML}
        </div>
        <div class="flex items-center justify-between text-[8px] text-white/50 font-medium">
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
            bar.className = 'w-0.5 rounded-full bg-suv-gold';
          } else {
            bar.className = 'w-0.5 rounded-full bg-white/30';
          }
        });
      });

      audio.addEventListener('ended', () => {
        isPlaying = false;
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        timeElapsed.textContent = '0:00';
        waveformBars.forEach(bar => {
          bar.className = 'w-0.5 rounded-full bg-white/30';
        });
      });
    }

    if (isPlaying) {
      audio.pause();
      isPlaying = false;
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
    } else {
      window.dispatchEvent(new CustomEvent('suv_audio_play', { detail: { currentAudio: audio } }));
      audio.play().catch(err => console.warn('Audio playback error:', err));
      isPlaying = true;
      playIcon.classList.add('hidden');
      pauseIcon.classList.remove('hidden');
    }
  });

  const handleAudioPlay = (e) => {
    if (audio && e.detail.currentAudio !== audio && isPlaying) {
      audio.pause();
      isPlaying = false;
      playIcon.classList.remove('hidden');
      pauseIcon.classList.add('hidden');
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
        <div class="flex items-center gap-2 text-xs">
          <span class="text-white/60">Sujet :</span>
          <span class="text-suv-gold font-bold">${vehicle.marque} ${vehicle.modele}</span>
        </div>
        <span class="text-[10px] bg-suv-gold/15 text-suv-gold px-1.5 py-0.5 rounded font-bold">${formattedPrice}</span>
      `;
      contextBar.classList.remove('hidden');
    } else {
      contextBar.innerHTML = '';
      contextBar.classList.add('hidden');
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
  if (!state.user || state.user.role === 'admin') return ''; // Don't show if visitor or admin

  return `
    <!-- Floating Chat Widget -->
    <div id="floating-chat-container" class="fixed bottom-6 right-6 z-40 flex flex-col items-end">
      
      <!-- Collapsed Bubble -->
      <button id="chat-toggle-bubble" class="w-14 h-14 bg-gradient-premium-red text-white rounded-full flex items-center justify-center shadow-xl shadow-suv-red/30 hover:scale-105 transition-all duration-300 animate-pulse-glow relative">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
        </svg>
        <span id="chat-badge" class="absolute -top-1 -right-1 bg-suv-gold text-suv-red text-xxs font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-suv-darker hidden">0</span>
      </button>
 
      <!-- Chat Box Panel (Hidden by default) -->
      <div id="chat-box-panel" class="hidden w-[360px] h-[460px] glass-panel bg-suv-dark border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-slide-up">
        
        <!-- Chat Header -->
        <div class="bg-gradient-premium-red px-4 py-3.5 flex items-center justify-between shadow-md">
          <div class="flex items-center gap-2.5">
            <div class="relative">
              <img src="https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Admin" class="w-9 h-9 rounded-full object-cover border border-white/20">
              <span class="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border border-suv-red rounded-full"></span>
            </div>
            <div>
              <h4 class="text-sm font-bold text-white font-display">Conseiller Commercial</h4>
              <p class="text-xxs text-white/70">En ligne • Répond en direct</p>
            </div>
          </div>
          <button id="chat-close-btn" class="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Vehicle Context Bar (Container filled dynamically) -->
        <div id="chat-vehicle-context-bar" class="hidden bg-suv-slate/40 border-b border-white/5 px-4 py-2 flex items-center justify-between gap-4"></div>

        <!-- Message List -->
        <div id="chat-messages-list" class="flex-grow p-4 overflow-y-auto space-y-3 flex flex-col bg-suv-darker">
          <div class="text-center py-6 text-xs text-white/30">Chargement de la conversation...</div>
        </div>

        <!-- Typing Indicator -->
        <div id="chat-typing-indicator" class="hidden bg-suv-darker px-4 py-2 text-xxs text-white/50 italic flex items-center gap-1.5 border-t border-white/5">
          <div class="flex gap-0.5 items-center">
            <span class="w-1.5 h-1.5 bg-suv-gold rounded-full animate-bounce"></span>
            <span class="w-1.5 h-1.5 bg-suv-gold rounded-full animate-bounce [animation-delay:0.2s]"></span>
            <span class="w-1.5 h-1.5 bg-suv-gold rounded-full animate-bounce [animation-delay:0.4s]"></span>
          </div>
          <span>Le conseiller écrit...</span>
        </div>

        <!-- Input Box -->
        <form id="chat-input-form" class="p-3 bg-suv-slate border-t border-white/5 flex items-center gap-2 relative">
          <!-- Text Input Container -->
          <div id="chat-input-text-container" class="flex-grow flex items-center gap-2">
            <input type="text" id="chat-text-input" placeholder="Écrivez votre message..." class="flex-grow suv-input text-sm py-2 px-3 focus:border-suv-gold" required autocomplete="off">
            <button type="button" id="chat-mic-btn" class="text-white/60 hover:text-suv-gold p-2 hover:bg-white/5 rounded-lg flex items-center justify-center transition-all duration-200" title="Enregistrer une note vocale">
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>

          <!-- Recording State Container -->
          <div id="chat-input-recording-container" class="hidden flex-grow flex items-center justify-between bg-black/20 rounded-xl px-3 py-1.5 border border-suv-gold/20 animate-pulse-glow">
            <div class="flex items-center gap-2">
              <span class="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping"></span>
              <span class="text-xs text-rose-500 font-bold font-mono" id="chat-recording-timer">0:00</span>
              <span class="text-xxs text-white/50">Enregistrement...</span>
            </div>
            <div class="flex items-center gap-1.5">
              <!-- Cancel Button -->
              <button type="button" id="chat-cancel-record-btn" class="text-white/40 hover:text-rose-500 p-1.5 hover:bg-white/5 rounded-lg transition-colors" title="Annuler">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              <!-- Send/Stop Button -->
              <button type="button" id="chat-send-record-btn" class="bg-suv-gold hover:bg-suv-yellow text-suv-darker p-1.5 rounded-lg transition-colors flex items-center justify-center" title="Envoyer la note vocale">
                <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Submit Text Button -->
          <button type="submit" id="chat-submit-btn" class="bg-suv-red hover:bg-suv-purple text-white p-2.5 rounded-lg flex items-center justify-center transition-colors">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
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
      panel.classList.remove('hidden');
      bubble.classList.add('hidden');
      
      // Fetch initial history
      await loadMessages();
      
      // Clear badge
      badge.textContent = '0';
      badge.classList.add('hidden');
      store.updateUnreadCount();

      // Update context bar in UI
      if (currentVehicleContext) {
        updateChatVehicleContext(currentVehicleContext);
      }
    };

    // Close Chat
    const closeChat = () => {
      panel.classList.add('hidden');
      bubble.classList.remove('hidden');
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
        list.innerHTML = `<div class="text-center py-4 text-xs text-rose-400">Erreur de chargement des messages</div>`;
      }
    };

    // Render messages in DOM
    const renderMessages = (messages) => {
      if (!list) return;

      if (messages.length === 0) {
        list.innerHTML = `
          <div class="text-center py-8 text-xs text-white/30 space-y-2 my-auto">
            <p>Aucun message. Entamez la discussion !</p>
            <p class="text-[10px] text-white/20">Votre conseiller vous répondra sous quelques minutes.</p>
          </div>
        `;
        return;
      }

      const currentUserId = store.getState().user?.id;

      list.innerHTML = messages.map(msg => {
        const isSelf = msg.sender_id === currentUserId;
        const bgClass = isSelf ? 'bg-suv-red text-white self-end rounded-br-none' : 'bg-suv-slate text-suv-light self-start rounded-bl-none';
        const time = new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        
        const isAudio = msg.contenu && msg.contenu.startsWith('[audio]:');
        const contentHtml = isAudio 
          ? renderAudioPlayer(msg.contenu.substring(8), msg.id) 
          : `<span>${msg.contenu}</span>`;

        return `
          <div class="max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${bgClass} shadow-md flex flex-col" data-msg-id="${msg.id || ''}">
            ${contentHtml}
            <span class="text-[9px] opacity-60 text-suv-light self-end mt-1.5">${time}</span>
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
            textContainer.classList.add('hidden');
            submitBtn.classList.add('hidden');
            recordingContainer.classList.remove('hidden');
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
          textContainer.classList.remove('hidden');
          submitBtn.classList.remove('hidden');
          recordingContainer.classList.add('hidden');
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
          const bgClass = 'bg-suv-red text-white self-end rounded-br-none opacity-70';
          const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
          const localAudioUrl = URL.createObjectURL(audioBlob);

          const msgDiv = document.createElement('div');
          msgDiv.className = `max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${bgClass} shadow-md flex flex-col transition-all duration-300`;
          msgDiv.setAttribute('data-msg-id', tempId);
          msgDiv.setAttribute('data-pending', 'true');
          msgDiv.innerHTML = `
            ${renderAudioPlayer(localAudioUrl, tempId)}
            <span class="text-[9px] opacity-60 text-suv-light self-end mt-1.5 flex items-center gap-1">
              ${time}
              <svg class="animate-spin h-3 w-3 text-white/50" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
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
            }
          } catch (err) {
            console.error('Failed to send voice note:', err);
            const existingTemp = list.querySelector(`[data-msg-id="${tempId}"]`);
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
        const bgClass = 'bg-suv-red text-white self-end rounded-br-none opacity-70';
        const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

        const msgDiv = document.createElement('div');
        msgDiv.className = `max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${bgClass} shadow-md flex flex-col transition-all duration-300`;
        msgDiv.setAttribute('data-msg-id', tempId);
        msgDiv.setAttribute('data-pending', 'true');
        msgDiv.innerHTML = `
          <span>${txt}</span>
          <span class="text-[9px] opacity-60 text-suv-light self-end mt-1.5 flex items-center gap-1">
            ${time}
            <svg class="animate-spin h-3 w-3 text-white/50" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
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
            // Update the temporary message to be fully sent
            const existingTemp = list.querySelector(`[data-msg-id="${tempId}"]`);
            if (existingTemp) {
              existingTemp.setAttribute('data-msg-id', sentMsg.id);
              existingTemp.removeAttribute('data-pending');
              existingTemp.classList.remove('opacity-70');
              const timeSpan = existingTemp.querySelector('span:last-child');
              if (timeSpan) {
                timeSpan.innerHTML = new Date(sentMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              }
            }
          }
        } catch (err) {
          console.error('Failed to send message:', err);
          // Update temp message to error state
          const existingTemp = list.querySelector(`[data-msg-id="${tempId}"]`);
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

    // Subscribe to real-time messages
    if (activeSubscriptionUnsubscribe) {
      activeSubscriptionUnsubscribe(); // Cleanup old sub
    }

    activeSubscriptionUnsubscribe = subscribeToMessages(async (newMsg) => {
      const state = store.getState();
      const currentUserId = state.user?.id;

      // Check if new message relates to current conversation
      const isRelevant = 
        (newMsg.sender_id === adminId && newMsg.receiver_id === currentUserId) ||
        (newMsg.sender_id === currentUserId && newMsg.receiver_id === adminId);

      if (isRelevant) {
        // Instant Realtime Append
        const existing = list.querySelector(`[data-msg-id="${newMsg.id}"]`);
        if (!existing) {
          const isSelf = newMsg.sender_id === currentUserId;
          
          if (isSelf) {
            // Find a pending element with the same text/audio
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
              pendingEl.classList.remove('opacity-70');
              const timeSpan = pendingEl.querySelector('span:last-child');
              if (timeSpan) {
                const time = new Date(newMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                timeSpan.innerHTML = time;
              }
              return;
            }
          }

          const bgClass = isSelf ? 'bg-suv-red text-white self-end rounded-br-none' : 'bg-suv-slate text-suv-light self-start rounded-bl-none';
          const time = new Date(newMsg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

          const msgDiv = document.createElement('div');
          msgDiv.className = `max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${bgClass} shadow-md flex flex-col`;
          msgDiv.setAttribute('data-msg-id', newMsg.id || '');
          
          const isAudio = newMsg.contenu && newMsg.contenu.startsWith('[audio]:');
          const contentHtml = isAudio 
            ? renderAudioPlayer(newMsg.contenu.substring(8), newMsg.id) 
            : `<span>${newMsg.contenu}</span>`;

          msgDiv.innerHTML = `
            ${contentHtml}
            <span class="text-[9px] opacity-60 text-suv-light self-end mt-1.5">${time}</span>
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

          // Mark received message as read in database
          if (newMsg.receiver_id === currentUserId && !newMsg.lu) {
            await getMessages(adminId); // marks as read
          }
        }
        
        // If chat is collapsed and message is from admin, increment bubble badge
        if (panel.classList.contains('hidden') && newMsg.sender_id === adminId) {
          const currentCount = parseInt(badge.textContent) || 0;
          const newCount = currentCount + 1;
          badge.textContent = newCount.toString();
          badge.classList.remove('hidden');
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
              typingIndicator.classList.remove('hidden');
              list.scrollTop = list.scrollHeight;
            }
          } else {
            if (typingIndicator) {
              typingIndicator.classList.add('hidden');
            }
          }
        }
      });
    }
  };

  runInit();
}
