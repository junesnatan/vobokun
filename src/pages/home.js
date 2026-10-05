import { getVehicles } from '../services/vehicles.js';
import { renderVehicleCard, initVehicleCards } from '../components/vehicle-card.js';
import { getFavorites } from '../services/favorites.js';
import { store } from '../store.js';
import { navigate } from '../router.js';

export function render() {
  return `
    <div class="space-y-24 animate-fade-in pb-16">
      
      <!-- 1. EDITORIAL HERO SHOWROOM -->
      <section class="hero-showroom-banner relative rounded-[32px] overflow-hidden min-h-[620px] flex items-center px-6 md:px-14 py-20 shadow-2xl border border-white/10 bg-[#0E1218]">
        
        <!-- Optimized Background Image with Luxury Dark Gradient Overlay -->
        <div class="absolute inset-0 z-0 overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1280&q=75" 
            alt="Showroom Vobokun" 
            class="w-full h-full object-cover object-center transform scale-105"
            loading="eager"
            fetchpriority="high"
          />
          <div class="absolute inset-0 bg-gradient-to-r from-[#080A0E] via-[#080A0E]/85 to-transparent"></div>
          <div class="absolute inset-0 bg-gradient-to-t from-[#080A0E] via-transparent to-transparent"></div>
        </div>
        
        <!-- Ambient Champagne Glow -->
        <div class="absolute -right-20 top-10 w-96 h-96 rounded-full bg-suv-gold/10 blur-[100px] pointer-events-none animate-float-slow z-10"></div>

        <!-- Hero Content (Instant 0ms display, no opacity-0) -->
        <div class="relative z-20 max-w-2xl space-y-6 text-left">
          
          <div class="inline-flex items-center gap-2.5 bg-suv-gold/10 text-suv-gold border border-suv-gold/30 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest font-display shadow-lg">
            <span class="w-2 h-2 rounded-full bg-suv-gold animate-pulse"></span>
            SHOWROOM D'EXCEPTION &middot; COTONOU
          </div>
          
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black font-display leading-[1.08] text-white uppercase tracking-tight">
            L'Excellence SUV <br>
            <span class="text-gradient-gold">Certifiée & Garantie.</span>
          </h1>
          
          <p class="text-sm sm:text-base text-white/80 leading-relaxed font-normal max-w-xl">
            Accédez à une sélection exclusive de SUV prestigieux rigoureusement inspectés sur 150 points. Négociation en direct, historique transparent et livraison clé en main.
          </p>
          
          <div class="flex flex-wrap items-center gap-4 pt-2">
            <a href="/catalogue" class="btn-premium-gold px-8 py-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2 shadow-xl" data-link>
              <span>Explorer la Collection</span>
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
            </a>
            <a href="#express-finance" class="btn-premium-dark px-7 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center gap-2">
              <svg class="w-4 h-4 text-suv-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
              <span>Simuler Financement</span>
            </a>
          </div>

          <!-- Quick Proof Points -->
          <div class="pt-6 border-t border-white/10 grid grid-cols-3 gap-4 text-left">
            <div>
              <div class="text-xl font-black font-display text-white">150<span class="text-suv-gold">+</span></div>
              <div class="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Points Contrôlés</div>
            </div>
            <div>
              <div class="text-xl font-black font-display text-white">12 <span class="text-suv-gold">Mois</span></div>
              <div class="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Garantie Totale</div>
            </div>
            <div>
              <div class="text-xl font-black font-display text-white">0 <span class="text-suv-gold">Délai</span></div>
              <div class="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Essai Immédiat</div>
            </div>
          </div>

        </div>
      </section>

      <!-- 2. FLOATING SEARCH DECK (INTEGRATED GLASS PANEL) -->
      <section class="max-w-5xl mx-auto -mt-20 relative z-30 px-4">
        <div class="glass-panel border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl">
          <form id="quick-search-form" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            
            <!-- Brand -->
            <div class="space-y-2 text-left">
              <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Marque</label>
              <select id="qs-brand" class="w-full suv-input text-xs font-semibold">
                <option value="">Toutes les marques</option>
                <option value="Toyota">Toyota</option>
                <option value="Land Rover">Land Rover</option>
                <option value="BMW">BMW</option>
                <option value="Porsche">Porsche</option>
                <option value="Jeep">Jeep</option>
                <option value="Audi">Audi</option>
                <option value="Mercedes-Benz">Mercedes-Benz</option>
                <option value="Peugeot">Peugeot</option>
              </select>
            </div>
            
            <!-- Budget Max -->
            <div class="space-y-2 text-left">
              <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Budget Max (FCFA)</label>
              <select id="qs-budget" class="w-full suv-input text-xs font-semibold">
                <option value="">Tous les budgets</option>
                <option value="30000000">Jusqu'à 30 000 000 FCFA</option>
                <option value="50000000">Jusqu'à 50 000 000 FCFA</option>
                <option value="75000000">Jusqu'à 75 000 000 FCFA</option>
                <option value="100000000">100 000 000 FCFA et +</option>
              </select>
            </div>

            <!-- Energy / Fuel -->
            <div class="space-y-2 text-left">
              <label class="text-[10px] font-black uppercase tracking-widest text-suv-gold">Motorisation</label>
              <select id="qs-carburant" class="w-full suv-input text-xs font-semibold">
                <option value="">Toutes énergies</option>
                <option value="Diesel">Diesel</option>
                <option value="Essence">Essence</option>
                <option value="Hybride">Hybride (PHEV)</option>
                <option value="Électrique">100% Électrique</option>
              </select>
            </div>
            
            <!-- Search Action Button -->
            <div>
              <button type="submit" class="w-full btn-premium-gold py-3.5 px-6 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <span>Rechercher</span>
              </button>
            </div>

          </form>
        </div>
      </section>

      <!-- 3. BRAND PILLS CLOUD -->
      <section class="space-y-6 text-center">
        <div class="space-y-1">
          <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Collections de Prestige</span>
          <h2 class="text-2xl font-black text-white uppercase tracking-tight">Constructeurs d'Élite</h2>
        </div>
        
        <div class="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto px-4">
          <button class="brand-shortcut-btn brand-card px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:text-suv-gold transition-all" data-brand="Toyota">
            Toyota
          </button>
          <button class="brand-shortcut-btn brand-card px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:text-suv-gold transition-all" data-brand="Land Rover">
            Land Rover
          </button>
          <button class="brand-shortcut-btn brand-card px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:text-suv-gold transition-all" data-brand="BMW">
            BMW
          </button>
          <button class="brand-shortcut-btn brand-card px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:text-suv-gold transition-all" data-brand="Porsche">
            Porsche
          </button>
          <button class="brand-shortcut-btn brand-card px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:text-suv-gold transition-all" data-brand="Mercedes-Benz">
            Mercedes-Benz
          </button>
          <button class="brand-shortcut-btn brand-card px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:text-suv-gold transition-all" data-brand="Audi">
            Audi
          </button>
          <button class="brand-shortcut-btn brand-card px-5 py-3 text-xs font-bold uppercase tracking-wider text-white hover:text-suv-gold transition-all" data-brand="Jeep">
            Jeep
          </button>
        </div>
      </section>

      <!-- 4. FEATURED SHOWROOM (VEHICULES EN VEDETTE) -->
      <section class="space-y-8 text-left">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Sélection Spéciale</span>
            <h2 class="text-3xl font-black text-white uppercase tracking-tight mt-1">Dernières Arrivées en Showroom</h2>
          </div>
          <a href="/catalogue" class="text-xs font-bold uppercase tracking-wider text-suv-gold hover:text-suv-gold-light transition-colors flex items-center gap-1.5" data-link>
            <span>Voir toute la flotte</span>
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
          </a>
        </div>

        <!-- Featured vehicles grid -->
        <div id="home-featured-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="col-span-full text-center py-12 text-suv-gray">Chargement instantané des véhicules...</div>
        </div>
      </section>

      <!-- 5. INTERACTIVE EXPRESS FINANCING CALCULATOR -->
      <section id="express-finance" class="glass-panel border border-white/15 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden text-left">
        <div class="absolute -right-24 -bottom-24 w-80 h-80 rounded-full bg-suv-gold/10 blur-[90px] pointer-events-none"></div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          
          <div class="lg:col-span-7 space-y-6">
            <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Calculateur en Direct</span>
            <h2 class="text-3xl font-black text-white uppercase tracking-tight">Simulez Votre Financement Sur-Mesure</h2>
            <p class="text-sm text-white/70 leading-relaxed max-w-xl">
              Estimez vos mensualités en ajustant le prix du véhicule et votre apport. Obtenez un accord de principe en moins de 24h avec nos partenaires bancaires certifiés.
            </p>

            <div class="space-y-5 pt-2">
              
              <!-- Vehicle Price Slider -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                  <span class="text-white/60">Prix du Véhicule</span>
                  <span class="text-suv-gold font-sans font-black text-sm" id="calc-price-label">42 500 000 FCFA</span>
                </div>
                <input type="range" id="calc-price-slider" min="15000000" max="85000000" step="500000" value="42500000" class="w-full">
              </div>

              <!-- Down Payment Slider -->
              <div class="space-y-2">
                <div class="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                  <span class="text-white/60">Apport Initial (20%)</span>
                  <span class="text-suv-gold font-sans font-black text-sm" id="calc-down-label">8 500 000 FCFA</span>
                </div>
                <input type="range" id="calc-down-slider" min="10" max="50" step="5" value="20" class="w-full">
              </div>

              <!-- Duration Selector -->
              <div class="space-y-2">
                <span class="text-xs font-bold uppercase tracking-wider text-white/60 block">Durée du Financement</span>
                <div class="grid grid-cols-4 gap-2.5">
                  <button type="button" class="calc-dur-btn py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-white hover:border-suv-gold" data-months="24">24 mois</button>
                  <button type="button" class="calc-dur-btn py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-white hover:border-suv-gold" data-months="36">36 mois</button>
                  <button type="button" class="calc-dur-btn py-2.5 rounded-xl border border-suv-gold bg-suv-gold/15 text-xs font-black uppercase tracking-wider text-suv-gold" data-months="48">48 mois</button>
                  <button type="button" class="calc-dur-btn py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-wider text-white hover:border-suv-gold" data-months="60">60 mois</button>
                </div>
              </div>

            </div>
          </div>

          <!-- Result Card -->
          <div class="lg:col-span-5">
            <div class="bg-black/60 border border-white/10 rounded-2xl p-8 space-y-6 text-center shadow-xl">
              <span class="text-[10px] font-black uppercase tracking-widest text-white/50">Mensualité Estimée</span>
              <div>
                <div class="text-3xl sm:text-4xl font-black font-display text-suv-gold text-glow-gold tracking-tight" id="calc-monthly-result">
                  798 500 FCFA
                </div>
                <div class="text-xs text-white/40 mt-1">/ mois (hors assurance facultative)</div>
              </div>

              <div class="pt-4 border-t border-white/10 space-y-2 text-xs text-white/60 text-left">
                <div class="flex justify-between">
                  <span>Montant financé :</span>
                  <span class="text-white font-bold" id="calc-financed-amount">34 000 000 FCFA</span>
                </div>
                <div class="flex justify-between">
                  <span>Taux indicatif :</span>
                  <span class="text-white font-bold">5.9% T.A.E.G.</span>
                </div>
              </div>

              <a href="/catalogue" class="btn-premium-gold block w-full py-4 rounded-xl text-xs uppercase tracking-wider font-black shadow-lg" data-link>
                Choisir un véhicule éligible
              </a>
            </div>
          </div>

        </div>
      </section>

      <!-- 6. THE VOBOKUN STANDARD (BENTO GRID) -->
      <section class="space-y-8 text-left">
        <div class="space-y-1">
          <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Nos Engagements</span>
          <h2 class="text-3xl font-black text-white uppercase tracking-tight">Le Standard Vobokun Atelier</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div class="glass-card p-6 rounded-2xl space-y-4">
            <div class="w-12 h-12 rounded-xl bg-suv-gold/15 border border-suv-gold/30 flex items-center justify-center text-suv-gold">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 class="text-base font-black text-white font-display uppercase">Audit 150 Points</h3>
            <p class="text-xs text-suv-gray leading-relaxed">
              Moteur, châssis, électronique, train roulant et carrosserie sont certifiés sans accident majeur.
            </p>
          </div>

          <div class="glass-card p-6 rounded-2xl space-y-4">
            <div class="w-12 h-12 rounded-xl bg-suv-gold/15 border border-suv-gold/30 flex items-center justify-center text-suv-gold">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
            </div>
            <h3 class="text-base font-black text-white font-display uppercase">Négociation Directe</h3>
            <p class="text-xs text-suv-gray leading-relaxed">
              Discutez directement avec le concessionnaire via le chat en ligne et faites des propositions d'offres en direct.
            </p>
          </div>

          <div class="glass-card p-6 rounded-2xl space-y-4">
            <div class="w-12 h-12 rounded-xl bg-suv-gold/15 border border-suv-gold/30 flex items-center justify-center text-suv-gold">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3 class="text-base font-black text-white font-display uppercase">Reprise Cash</h3>
            <p class="text-xs text-suv-gray leading-relaxed">
              Faites estimer votre véhicule actuel en ligne et déduisez sa valeur immédiatement de votre nouvel achat.
            </p>
          </div>

          <div class="glass-card p-6 rounded-2xl space-y-4">
            <div class="w-12 h-12 rounded-xl bg-suv-gold/15 border border-suv-gold/30 flex items-center justify-center text-suv-gold">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
            </div>
            <h3 class="text-base font-black text-white font-display uppercase">Garantie 12 Mois</h3>
            <p class="text-xs text-suv-gray leading-relaxed">
              Tous nos SUV bénéficient d'une couverture pièces et main d'œuvre valable dans le réseau agréé.
            </p>
          </div>

        </div>
      </section>

      <!-- 7. CLIENT TESTIMONIALS -->
      <section class="glass-panel border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-8">
        <div class="space-y-1">
          <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Expériences Clients</span>
          <h2 class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Ils ont Choisi Vobokun</h2>
        </div>

        <div id="testimonial-slide-content" class="space-y-6 transition-all duration-300">
          <div class="flex justify-center text-suv-gold gap-1 text-lg" id="testimonial-stars"></div>
          <blockquote class="text-base sm:text-lg text-white font-medium italic max-w-2xl mx-auto leading-relaxed" id="testimonial-text"></blockquote>
          <div class="flex items-center justify-center gap-3">
            <img id="testimonial-avatar" src="" alt="Client" class="w-12 h-12 rounded-full object-cover border-2 border-suv-gold/40 shadow-lg">
            <div class="text-left">
              <div class="text-sm font-bold text-white" id="testimonial-name"></div>
              <div class="text-xs text-suv-gold font-semibold" id="testimonial-title"></div>
              <div class="text-[10px] text-suv-gray" id="testimonial-location"></div>
            </div>
          </div>
        </div>

        <div class="flex justify-center items-center gap-4 pt-2">
          <button id="prev-testimonial-btn" class="p-2 rounded-xl border border-white/10 hover:border-suv-gold hover:text-suv-gold transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div id="testimonial-dots" class="flex gap-2"></div>
          <button id="next-testimonial-btn" class="p-2 rounded-xl border border-white/10 hover:border-suv-gold hover:text-suv-gold transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>
      </section>

      <!-- 8. FAQ ACCORDION -->
      <section class="max-w-4xl mx-auto space-y-6 text-left">
        <div class="space-y-1 text-center">
          <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Foire Aux Questions</span>
          <h2 class="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">Tout ce que vous devez savoir</h2>
        </div>

        <div class="space-y-3 pt-4">
          
          <div class="faq-item glass-card rounded-2xl border border-white/5 overflow-hidden">
            <button class="faq-trigger w-full p-5 text-left flex justify-between items-center text-sm font-bold text-white hover:text-suv-gold transition-colors">
              <span>Comment se déroule la réservation et l'essai d'un véhicule ?</span>
              <svg class="faq-icon w-4 h-4 text-suv-gold transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </button>
            <div class="faq-answer px-5 pb-5 text-xs text-suv-gray leading-relaxed max-h-0 overflow-hidden transition-all duration-300">
              Il vous suffit de cliquer sur "Réserver un essai" sur la fiche du SUV ou de nous contacter via le chat. Notre showroom de Cotonou (Haie Vive) met le véhicule à votre disposition à la date convenue avec un conseiller dédié.
            </div>
          </div>

          <div class="faq-item glass-card rounded-2xl border border-white/5 overflow-hidden">
            <button class="faq-trigger w-full p-5 text-left flex justify-between items-center text-sm font-bold text-white hover:text-suv-gold transition-colors">
              <span>Puis-je négocier le prix affiché ?</span>
              <svg class="faq-icon w-4 h-4 text-suv-gold transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </button>
            <div class="faq-answer px-5 pb-5 text-xs text-suv-gray leading-relaxed max-h-0 overflow-hidden transition-all duration-300">
              Absolument. Vous disposez d'un bouton "Faire une offre de prix" sur chaque fiche véhicule. Votre proposition est transmise instantanément au responsable du showroom qui peut l'accepter, la refuser ou formuler une contre-offre.
            </div>
          </div>

          <div class="faq-item glass-card rounded-2xl border border-white/5 overflow-hidden">
            <button class="faq-trigger w-full p-5 text-left flex justify-between items-center text-sm font-bold text-white hover:text-suv-gold transition-colors">
              <span>Tous les véhicules sont-ils garantis ?</span>
              <svg class="faq-icon w-4 h-4 text-suv-gold transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </button>
            <div class="faq-answer px-5 pb-5 text-xs text-suv-gray leading-relaxed max-h-0 overflow-hidden transition-all duration-300">
              Oui, chaque SUV certifié Vobokun fait l'objet d'un contrôle rigoureux de 150 points et s'accompagne d'une garantie minimum de 12 mois couvrant le moteur, la boîte de vitesses et les composants majeurs.
            </div>
          </div>

        </div>
      </section>

    </div>
  `;
}

export async function init() {
  const featuredGrid = document.getElementById('home-featured-grid');
  const quickSearchForm = document.getElementById('quick-search-form');

  // Load featured vehicles immediately (0ms from local cache)
  try {
    const { data: vehicles } = await getVehicles({ featuredOnly: true, statut: 'disponible' }, 'dateDesc', 1, 6);
    
    let favIds = [];
    if (store.getState().user) {
      const { data: favs } = await getFavorites();
      favIds = favs.map(f => f.id);
    }

    if (featuredGrid) {
      if (vehicles.length === 0) {
        featuredGrid.innerHTML = `<div class="col-span-full text-center py-8 text-suv-gray">Aucun véhicule vedette disponible.</div>`;
      } else {
        featuredGrid.innerHTML = vehicles.map(v => renderVehicleCard(v, favIds.includes(v.id))).join('');
        initVehicleCards(featuredGrid);
      }
    }
  } catch (err) {
    console.error('Failed to load featured vehicles:', err);
  }

  // Quick Search Submission
  if (quickSearchForm) {
    quickSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const brand = document.getElementById('qs-brand')?.value;
      const budget = document.getElementById('qs-budget')?.value;
      const carburant = document.getElementById('qs-carburant')?.value;
      
      const newFilters = {};
      if (brand) newFilters.marque = [brand];
      if (budget) newFilters.prixMax = parseFloat(budget);
      if (carburant) newFilters.carburant = carburant;

      store.setFilters(newFilters);
      navigate('/catalogue');
    });
  }

  // Brand Shortcut Buttons
  document.querySelectorAll('.brand-shortcut-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const brand = btn.getAttribute('data-brand');
      if (brand) {
        store.setFilters({ marque: [brand] });
        navigate('/catalogue');
      }
    });
  });

  // Express Finance Calculator Logic
  const priceSlider = document.getElementById('calc-price-slider');
  const downSlider = document.getElementById('calc-down-slider');
  const priceLabel = document.getElementById('calc-price-label');
  const downLabel = document.getElementById('calc-down-label');
  const monthlyResult = document.getElementById('calc-monthly-result');
  const financedAmountLabel = document.getElementById('calc-financed-amount');
  let selectedDuration = 48;

  const updateFinanceCalculation = () => {
    if (!priceSlider || !downSlider || !monthlyResult) return;
    const price = parseFloat(priceSlider.value);
    const downPercent = parseFloat(downSlider.value);
    const downAmount = price * (downPercent / 100);
    const financed = price - downAmount;

    priceLabel.textContent = new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
    downLabel.textContent = new Intl.NumberFormat('fr-FR').format(downAmount) + ` FCFA (${downPercent}%)`;
    if (financedAmountLabel) {
      financedAmountLabel.textContent = new Intl.NumberFormat('fr-FR').format(financed) + ' FCFA';
    }

    // Monthly formula: r = 0.059 / 12; P * (r / (1 - (1+r)^-n))
    const r = 0.059 / 12;
    const monthly = financed * (r / (1 - Math.pow(1 + r, -selectedDuration)));
    monthlyResult.textContent = new Intl.NumberFormat('fr-FR').format(Math.round(monthly)) + ' FCFA';
  };

  if (priceSlider) priceSlider.addEventListener('input', updateFinanceCalculation);
  if (downSlider) downSlider.addEventListener('input', updateFinanceCalculation);

  document.querySelectorAll('.calc-dur-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.calc-dur-btn').forEach(b => {
        b.classList.remove('border-suv-gold', 'bg-suv-gold/15', 'text-suv-gold', 'font-black');
        b.classList.add('border-white/10', 'text-white');
      });
      btn.classList.add('border-suv-gold', 'bg-suv-gold/15', 'text-suv-gold', 'font-black');
      btn.classList.remove('border-white/10', 'text-white');
      selectedDuration = parseInt(btn.getAttribute('data-months'));
      updateFinanceCalculation();
    });
  });

  updateFinanceCalculation();

  // Testimonials Setup
  const testimonials = [
    {
      name: "Chantal Alapini",
      title: "Directrice Générale",
      location: "Fidjrossè, Cotonou",
      text: "Vobokun m'a permis d'acquérir mon Mercedes EQC dans une sérénité absolue. La négociation en direct par le chat et la livraison à domicile avec tous les papiers en règle ont été remarquables.",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
      name: "Marc Houndété",
      title: "Architecte d'Intérieur",
      location: "Haie Vive, Cotonou",
      text: "J'ai acheté mon Defender 110 après un essai le samedi matin. L'inspection des 150 points est d'une grande rigueur, le véhicule est comme neuf.",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
      name: "Koffi Mensah",
      title: "Consultant International",
      location: "Ganhi, Cotonou",
      text: "La reprise de mon ancien Prado s'est faite au juste prix en 48 heures. Le service client est digne des plus grands showrooms européens.",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    }
  ];

  let testIdx = 0;
  function updateTestimonial() {
    const data = testimonials[testIdx];
    const textElem = document.getElementById('testimonial-text');
    const nameElem = document.getElementById('testimonial-name');
    const titleElem = document.getElementById('testimonial-title');
    const locElem = document.getElementById('testimonial-location');
    const avatarElem = document.getElementById('testimonial-avatar');
    const starsElem = document.getElementById('testimonial-stars');
    const dotsElem = document.getElementById('testimonial-dots');

    if (!textElem) return;

    textElem.textContent = `"${data.text}"`;
    nameElem.textContent = data.name;
    titleElem.textContent = data.title;
    locElem.textContent = data.location;
    avatarElem.src = data.avatar;

    if (starsElem) {
      starsElem.innerHTML = Array(data.stars).fill().map(() => `
        <svg class="w-5 h-5 fill-current text-suv-gold" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      `).join('');
    }

    if (dotsElem) {
      dotsElem.innerHTML = testimonials.map((_, i) => `
        <button class="w-2.5 h-2.5 rounded-full transition-all ${i === testIdx ? 'bg-suv-gold w-6' : 'bg-white/20'}" data-idx="${i}"></button>
      `).join('');
      dotsElem.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
          testIdx = parseInt(b.getAttribute('data-idx'));
          updateTestimonial();
        });
      });
    }
  }

  updateTestimonial();

  const prevBtn = document.getElementById('prev-testimonial-btn');
  const nextBtn = document.getElementById('next-testimonial-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      testIdx = (testIdx - 1 + testimonials.length) % testimonials.length;
      updateTestimonial();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      testIdx = (testIdx + 1) % testimonials.length;
      updateTestimonial();
    });
  }

  // FAQ Accordion
  document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parent = trigger.closest('.faq-item');
      const answer = parent.querySelector('.faq-answer');
      const icon = trigger.querySelector('.faq-icon');
      const isOpen = answer.style.maxHeight && answer.style.maxHeight !== '0px';

      document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== parent) {
          const a = item.querySelector('.faq-answer');
          if (a) a.style.maxHeight = '0px';
          const ic = item.querySelector('.faq-icon');
          if (ic) ic.style.transform = 'rotate(0deg)';
        }
      });

      if (isOpen) {
        answer.style.maxHeight = '0px';
        icon.style.transform = 'rotate(0deg)';
      } else {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.style.transform = 'rotate(45deg)';
      }
    });
  });
}
