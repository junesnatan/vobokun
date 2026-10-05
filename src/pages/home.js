import { getVehicles } from '../services/vehicles.js';
import { renderVehicleCard, initVehicleCards } from '../components/vehicle-card.js';
import { getFavorites } from '../services/favorites.js';
import { store } from '../store.js';
import { navigate } from '../router.js';

export function render() {
  return `
    <div class="space-y-28 animate-fade-in pb-12">
      
      <!-- 1. FULLSCREEN HERO BANNER SECTION -->
      <section class="relative rounded-[32px] overflow-hidden min-h-[580px] flex items-center px-6 md:px-16 py-24 shadow-2xl border border-white/5">
        
        <!-- Animated Background Slideshow -->
        <div class="absolute inset-0 z-0 overflow-hidden">
          <div class="hero-slide absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] opacity-100 scale-100 animate-ken-burns" style="background-image: url('https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1920&q=80');"></div>
          <div class="hero-slide absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] opacity-0" style="background-image: url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=80');"></div>
          <div class="hero-slide absolute inset-0 bg-cover bg-center transition-all duration-[2000ms] opacity-0" style="background-image: url('https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1920&q=80');"></div>
        </div>

        <!-- Luxury ambient linear overlay -->
        <div class="absolute inset-0 bg-gradient-to-r from-[#0b090c] via-[#0b090c]/75 to-transparent z-10"></div>
        <div class="absolute inset-0 bg-gradient-to-t from-[#0b090c] via-transparent to-transparent z-10"></div>
        
        <!-- Floating decor lights -->
        <div class="absolute -right-20 top-10 w-80 h-80 rounded-full bg-suv-gold/5 blur-[85px] pointer-events-none animate-float-slow z-10"></div>

        <div class="relative z-20 max-w-2xl space-y-6 text-left">
          <span class="inline-flex items-center gap-2 bg-[#92000A]/10 text-suv-gold border border-suv-gold/20 px-4 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest font-display animate-pulse-glow">
            <span class="w-1.5 h-1.5 rounded-full bg-suv-gold"></span>
            SHOWROOM D'EXCEPTION EN AFRIQUE
          </span>
          <h1 class="text-4xl md:text-6xl font-black font-display leading-[1.1] text-white uppercase tracking-tight transform translate-y-4 opacity-0 transition-all duration-1000 ease-out" id="hero-title">
            L'excellence <br>
            <span class="text-gradient-red-gold text-glow-gold">automobile</span> redéfinie.
          </h1>
          <p class="text-sm md:text-base text-white/75 leading-relaxed font-light max-w-xl transform translate-y-4 opacity-0 transition-all duration-1000 ease-out delay-200" id="hero-desc">
            Entrez dans l'univers de la distinction. Vobokun sélectionne pour vous des SUV prestigieux, rigoureusement inspectés et garantis, alliant performance souveraine et luxe absolu.
          </p>
          <div class="flex flex-wrap gap-4 pt-4 transform translate-y-4 opacity-0 transition-all duration-1000 ease-out delay-500" id="hero-actions">
            <a href="/catalogue" class="btn-premium-gold hover:shadow-lg text-suv-dark px-8 py-4 rounded-xl font-extrabold text-xs uppercase tracking-wider transition-all duration-300" data-link>
              Explorer le catalogue
            </a>
            <a href="/catalogue" class="border border-white/10 hover:border-white hover:bg-white/5 text-white px-8 py-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all duration-300" data-link>
              Recherche Avancée
            </a>
          </div>
        </div>
      </section>

      <!-- 2. QUICK SEARCH BAR (INTEGRATED GLASS PANEL) -->
      <section class="max-w-5xl mx-auto -mt-36 relative z-20 px-4">
        <div class="glass-panel border border-white/10 rounded-3xl p-6 shadow-2xl">
          <form id="quick-search-form" class="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            
            <!-- Brand Selection -->
            <div class="space-y-2.5 text-left">
              <label class="text-[10px] font-extrabold uppercase tracking-widest text-suv-gray">Sélectionner une Marque</label>
              <select id="qs-brand" class="w-full suv-input bg-[#1a151c] border-white/10 focus:border-suv-gold text-sm font-semibold">
                <option value="">Toutes les marques</option>
                <option value="Toyota">Toyota</option>
                <option value="Land Rover">Land Rover</option>
                <option value="BMW">BMW</option>
                <option value="Porsche">Porsche</option>
                <option value="Jeep">Jeep</option>
                <option value="Audi">Audi</option>
                <option value="Mercedes-Benz">Mercedes-Benz</option>
              </select>
            </div>
            
            <!-- Budget Max -->
            <div class="space-y-2.5 text-left">
              <label class="text-[10px] font-extrabold uppercase tracking-widest text-suv-gray">Budget Maximum</label>
              <select id="qs-budget" class="w-full suv-input bg-[#1a151c] border-white/10 focus:border-suv-gold text-sm font-semibold">
                <option value="">Tous les budgets</option>
                <option value="30000000">30 000 000 FCFA</option>
                <option value="50000000">50 000 000 FCFA</option>
                <option value="75000000">75 000 000 FCFA</option>
                <option value="100000000">100 000 000 FCFA</option>
              </select>
            </div>
            
            <!-- Search Button -->
            <div>
              <button type="submit" class="w-full btn-premium-red text-white py-4 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                Lancer la Recherche
              </button>
            </div>

          </form>
        </div>
      </section>

      <!-- 3. BRAND LOGOS CAROUSEL / CLOUD -->
      <section class="space-y-6 text-center">
        <div class="space-y-1">
          <span class="text-suv-gold font-bold text-[10px] uppercase tracking-widest font-display">Collections</span>
          <h2 class="text-sm font-bold text-white/50 uppercase tracking-widest">Nos Marques de Prestige</h2>
        </div>
        
        <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-6xl mx-auto">
          
          <button data-brand="Land Rover" class="brand-shortcut-btn brand-card p-6 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
            <span class="font-bold text-white font-display group-hover:text-suv-gold transition-colors tracking-tight text-sm uppercase">Land Rover</span>
            <span class="text-[9px] text-white/30 uppercase tracking-widest font-bold">Découvrir</span>
          </button>

          <button data-brand="Toyota" class="brand-shortcut-btn brand-card p-6 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
            <span class="font-bold text-white font-display group-hover:text-suv-gold transition-colors tracking-tight text-sm uppercase">Toyota</span>
            <span class="text-[9px] text-white/30 uppercase tracking-widest font-bold">Découvrir</span>
          </button>

          <button data-brand="Porsche" class="brand-shortcut-btn brand-card p-6 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
            <span class="font-bold text-white font-display group-hover:text-suv-gold transition-colors tracking-tight text-sm uppercase">Porsche</span>
            <span class="text-[9px] text-white/30 uppercase tracking-widest font-bold">Découvrir</span>
          </button>

          <button data-brand="BMW" class="brand-shortcut-btn brand-card p-6 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
            <span class="font-bold text-white font-display group-hover:text-suv-gold transition-colors tracking-tight text-sm uppercase">BMW</span>
            <span class="text-[9px] text-white/30 uppercase tracking-widest font-bold">Découvrir</span>
          </button>

          <button data-brand="Mercedes-Benz" class="brand-shortcut-btn brand-card p-6 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
            <span class="font-bold text-white font-display group-hover:text-suv-gold transition-colors tracking-tight text-sm uppercase">Mercedes</span>
            <span class="text-[9px] text-white/30 uppercase tracking-widest font-bold">Découvrir</span>
          </button>

          <button data-brand="Jeep" class="brand-shortcut-btn brand-card p-6 rounded-2xl flex flex-col items-center justify-center gap-2 group transition-all">
            <span class="font-bold text-white font-display group-hover:text-suv-gold transition-colors tracking-tight text-sm uppercase">Jeep</span>
            <span class="text-[9px] text-white/30 uppercase tracking-widest font-bold">Découvrir</span>
          </button>

        </div>
      </section>

      <!-- 4. L'EXPÉRIENCE VOBOKUN (VALUE PROPOSITIONS) -->
      <section class="space-y-12 max-w-6xl mx-auto">
        <div class="text-center space-y-2">
          <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Services Premium</span>
          <h2 class="text-3xl font-extrabold text-white uppercase tracking-tight">L'Expérience Vobokun</h2>
          <p class="text-sm text-suv-gray max-w-md mx-auto">Une suite de garanties d'exception pour un achat en toute sérénité.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          
          <div class="glass-card p-6 rounded-3xl space-y-4 border border-white/5">
            <div class="w-12 h-12 rounded-2xl bg-gradient-premium-red flex items-center justify-center text-suv-gold shadow-lg">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <h3 class="font-bold text-white text-base uppercase font-display tracking-tight">Sélection Certifiée</h3>
            <p class="text-xs text-suv-gray leading-relaxed font-light">Chaque véhicule est soumis à une inspection rigoureuse de 150 points de contrôle mécaniques et électroniques.</p>
          </div>

          <div class="glass-card p-6 rounded-3xl space-y-4 border border-white/5">
            <div class="w-12 h-12 rounded-2xl bg-gradient-premium-red flex items-center justify-center text-suv-gold shadow-lg">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"/></svg>
            </div>
            <h3 class="font-bold text-white text-base uppercase font-display tracking-tight">Garantie Européenne</h3>
            <p class="text-xs text-suv-gray leading-relaxed font-light">Profitez d'une tranquillité d'esprit absolue avec une garantie complète pièces et main-d'œuvre de 12 à 24 mois.</p>
          </div>

          <div class="glass-card p-6 rounded-3xl space-y-4 border border-white/5">
            <div class="w-12 h-12 rounded-2xl bg-gradient-premium-red flex items-center justify-center text-suv-gold shadow-lg">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16V7"/></svg>
            </div>
            <h3 class="font-bold text-white text-base uppercase font-display tracking-tight">Financement Agile</h3>
            <p class="text-xs text-suv-gray leading-relaxed font-light">Des partenariats bancaires d'élite pour vous offrir des solutions de crédit-bail et de financement modulables.</p>
          </div>

          <div class="glass-card p-6 rounded-3xl space-y-4 border border-white/5">
            <div class="w-12 h-12 rounded-2xl bg-gradient-premium-red flex items-center justify-center text-suv-gold shadow-lg">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </div>
            <h3 class="font-bold text-white text-base uppercase font-display tracking-tight">Livraison VIP</h3>
            <p class="text-xs text-suv-gray leading-relaxed font-light">Service de convoyage de prestige et mise en main personnalisée à domicile ou à votre bureau.</p>
          </div>

        </div>
      </section>

      <!-- 5. FEATURED VEHICLES GRID -->
      <section class="space-y-8">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 text-left">
          <div>
            <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Collections</span>
            <h2 class="text-3xl font-extrabold text-white uppercase tracking-tight">Nos Offres d'Exception</h2>
          </div>
          <a href="/catalogue" class="text-suv-gold hover:text-suv-yellow font-bold text-xs uppercase tracking-wider transition-colors flex items-center gap-1 group" data-link>
            Accéder au showroom 
            <svg class="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </a>
        </div>

        <div id="featured-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div class="col-span-full text-center py-12 text-suv-gray">Chargement des véhicules...</div>
        </div>
      </section>

      <!-- 6. STATISTICS CARDS SECTION (PREMIUM INTERACTIVE DESIGN) -->
      <section class="max-w-6xl mx-auto space-y-8 relative z-10">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <!-- Stat 1 -->
          <div class="glass-panel border border-white/5 rounded-3xl p-8 text-center relative overflow-hidden group hover:border-suv-gold/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-suv-gold/5">
            <div class="absolute -right-10 -top-10 w-24 h-24 rounded-full bg-suv-gold/5 blur-xl group-hover:bg-suv-gold/10 transition-all"></div>
            <div class="w-12 h-12 rounded-2xl bg-suv-gold/10 border border-suv-gold/20 flex items-center justify-center text-suv-gold mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.969 0 1.371 1.24.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.175 0l-3.97 2.883c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.493 10.1c-.783-.57-.38-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.519-4.674z"/></svg>
            </div>
            <p class="text-4xl font-black font-display text-gradient-premium mb-1">15+</p>
            <h4 class="text-xs font-bold uppercase tracking-wider text-white">Marques de prestige</h4>
            <p class="text-[10px] text-suv-gray mt-2 leading-relaxed font-light">Une sélection des constructeurs les plus exclusifs de la planète.</p>
          </div>

          <!-- Stat 2 -->
          <div class="glass-panel border border-white/5 rounded-3xl p-8 text-center relative overflow-hidden group hover:border-suv-red/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-suv-red/5">
            <div class="absolute -right-10 -top-10 w-24 h-24 rounded-full bg-suv-red/5 blur-xl group-hover:bg-suv-red/10 transition-all"></div>
            <div class="w-12 h-12 rounded-2xl bg-suv-red/10 border border-suv-red/20 flex items-center justify-center text-suv-red mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p class="text-4xl font-black font-display text-gradient-premium mb-1">48h</p>
            <h4 class="text-xs font-bold uppercase tracking-wider text-white">Mise en main VIP</h4>
            <p class="text-[10px] text-suv-gray mt-2 leading-relaxed font-light">Préparation minutieuse et livraison à votre domicile ou bureau au Bénin.</p>
          </div>

          <!-- Stat 3 -->
          <div class="glass-panel border border-white/5 rounded-3xl p-8 text-center relative overflow-hidden group hover:border-suv-gold/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-suv-gold/5">
            <div class="absolute -right-10 -top-10 w-24 h-24 rounded-full bg-suv-gold/5 blur-xl group-hover:bg-suv-gold/10 transition-all"></div>
            <div class="w-12 h-12 rounded-2xl bg-suv-gold/10 border border-suv-gold/20 flex items-center justify-center text-suv-gold mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
            </div>
            <p class="text-4xl font-black font-display text-gradient-premium mb-1">100%</p>
            <h4 class="text-xs font-bold uppercase tracking-wider text-white">Historiques vérifiés</h4>
            <p class="text-[10px] text-suv-gray mt-2 leading-relaxed font-light">Traçabilité complète, entretien certifié constructeur et aucun accident.</p>
          </div>

          <!-- Stat 4 -->
          <div class="glass-panel border border-white/5 rounded-3xl p-8 text-center relative overflow-hidden group hover:border-suv-red/30 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-suv-red/5">
            <div class="absolute -right-10 -top-10 w-24 h-24 rounded-full bg-suv-red/5 blur-xl group-hover:bg-suv-red/10 transition-all"></div>
            <div class="w-12 h-12 rounded-2xl bg-suv-red/10 border border-suv-red/20 flex items-center justify-center text-suv-red mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
            </div>
            <p class="text-4xl font-black font-display text-gradient-premium mb-1">4.9/5</p>
            <h4 class="text-xs font-bold uppercase tracking-wider text-white">Satisfaction client</h4>
            <p class="text-[10px] text-suv-gray mt-2 leading-relaxed font-light">La note moyenne accordée par nos acheteurs les plus exigeants au Bénin.</p>
          </div>

        </div>
      </section>

      <!-- 7. VIP TESTIMONIALS SECTION (SLIDING CAROUSEL SYSTEM) -->
      <section class="space-y-12 max-w-4xl mx-auto text-left relative z-10">
        <div class="text-center space-y-2">
          <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">Avis Privilèges</span>
          <h2 class="text-3xl font-extrabold text-white uppercase tracking-tight font-display">Ils nous font confiance</h2>
          <p class="text-xs text-suv-gray max-w-md mx-auto">Découvrez les retours d'expérience de nos acheteurs VIP au Bénin.</p>
        </div>

        <!-- Slider Viewport Card -->
        <div class="glass-panel border border-white/10 rounded-[32px] p-8 md:p-14 shadow-2xl relative min-h-[340px] flex flex-col justify-between overflow-hidden" id="testimonial-carousel-card">
          <!-- Ambient decor glow -->
          <div class="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-suv-gold/5 blur-[40px] pointer-events-none"></div>
          
          <!-- Slide Content (Animates in out) -->
          <div id="testimonial-slide-content" class="transition-all duration-300 ease-in-out space-y-6">
            <div class="flex items-center justify-between">
              <!-- Rated Star Icons Container -->
              <div class="flex items-center gap-1 text-suv-gold" id="testimonial-stars">
                <!-- Injected in JS -->
              </div>
              <span class="text-6xl font-serif text-suv-gold/20 leading-none">“</span>
            </div>

            <!-- Quote Text -->
            <p class="text-base md:text-lg text-white/95 font-light leading-relaxed italic" id="testimonial-text">
              <!-- Injected in JS -->
            </p>

            <!-- User details -->
            <div class="flex items-center gap-4 pt-6 border-t border-white/5">
              <img id="testimonial-avatar" class="w-12 h-12 rounded-full border border-suv-gold/30 object-cover" src="" alt="">
              <div>
                <h4 id="testimonial-name" class="font-bold text-white text-sm uppercase tracking-wide"></h4>
                <p id="testimonial-title" class="text-xs text-suv-gray font-medium"></p>
                <p id="testimonial-location" class="text-[10px] text-suv-gold mt-1 font-bold uppercase tracking-wider"></p>
              </div>
            </div>
          </div>

          <!-- Slider Arrows (hidden on small devices) -->
          <button id="prev-testimonial-btn" class="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white flex items-center justify-center transition-all focus:outline-none hidden md:flex">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <button id="next-testimonial-btn" class="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white flex items-center justify-center transition-all focus:outline-none hidden md:flex">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>

          <!-- Dot Indicators at bottom -->
          <div class="flex justify-center items-center gap-2 pt-6" id="testimonial-dots">
            <!-- Injected in JS -->
          </div>
        </div>
      </section>

      <!-- 7.5. INTERACTIVE FAQ SECTION (ACCORDION GLASSMORPHISM) -->
      <section class="max-w-4xl mx-auto text-left space-y-8 relative z-10">
        <div class="text-center space-y-2">
          <span class="text-suv-gold font-bold text-xs uppercase tracking-widest font-display">FAQ</span>
          <h2 class="text-3xl font-extrabold text-white uppercase tracking-tight font-display">Questions Fréquentes</h2>
          <p class="text-xs text-suv-gray max-w-md mx-auto">Trouvez des réponses claires sur le processus d'acquisition d'un véhicule d'exception au Bénin.</p>
        </div>

        <div class="space-y-4">
          
          <!-- FAQ 1 -->
          <div class="glass-panel border border-white/5 rounded-2xl overflow-hidden faq-item transition-all duration-300 hover:border-white/10">
            <button class="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none faq-trigger">
              <span class="font-bold text-sm text-white md:text-base font-display">Comment puis-je essayer un véhicule de prestige ?</span>
              <svg class="w-5 h-5 text-suv-gold transform transition-transform duration-300 faq-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </button>
            <div class="max-h-0 overflow-hidden transition-all duration-300 ease-in-out faq-answer">
              <div class="p-6 pt-0 text-xs md:text-sm text-suv-gray leading-relaxed font-light border-t border-white/5 bg-white/1">
                Sur rendez-vous uniquement. Nos conseillers de vente vous accueillent dans notre showroom privé situé à la Haie Vive (Cotonou) pour une présentation personnalisée du modèle et un essai routier guidé en toute discrétion.
              </div>
            </div>
          </div>

          <!-- FAQ 2 -->
          <div class="glass-panel border border-white/5 rounded-2xl overflow-hidden faq-item transition-all duration-300 hover:border-white/10">
            <button class="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none faq-trigger">
              <span class="font-bold text-sm text-white md:text-base font-display">Quelles garanties offrez-vous sur les véhicules ?</span>
              <svg class="w-5 h-5 text-suv-gold transform transition-transform duration-300 faq-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </button>
            <div class="max-h-0 overflow-hidden transition-all duration-300 ease-in-out faq-answer">
              <div class="p-6 pt-0 text-xs md:text-sm text-suv-gray leading-relaxed font-light border-t border-white/5 bg-white/1">
                Chaque véhicule vendu par Vobokun bénéficie d'une garantie pièces et main-d'œuvre de 12 à 24 mois. Avant la vente, un audit technique de 150 points de contrôle (moteur, électronique, trains roulants) est mené et les résultats vous sont fournis en toute transparence.
              </div>
            </div>
          </div>

          <!-- FAQ 3 -->
          <div class="glass-panel border border-white/5 rounded-2xl overflow-hidden faq-item transition-all duration-300 hover:border-white/10">
            <button class="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none faq-trigger">
              <span class="font-bold text-sm text-white md:text-base font-display">Les frais de douane et de transport au port de Cotonou sont-ils inclus ?</span>
              <svg class="w-5 h-5 text-suv-gold transform transition-transform duration-300 faq-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </button>
            <div class="max-h-0 overflow-hidden transition-all duration-300 ease-in-out faq-answer">
              <div class="p-6 pt-0 text-xs md:text-sm text-suv-gray leading-relaxed font-light border-t border-white/5 bg-white/1">
                Oui, nos tarifs de négociation peuvent inclure une option « clés en main ». Cela couvre le fret maritime, les taxes douanières complètes au Port Autonome de Cotonou, ainsi que l'assistance pour l'obtention de la carte grise béninoise.
              </div>
            </div>
          </div>

          <!-- FAQ 4 -->
          <div class="glass-panel border border-white/5 rounded-2xl overflow-hidden faq-item transition-all duration-300 hover:border-white/10">
            <button class="w-full py-5 px-6 flex items-center justify-between text-left focus:outline-none faq-trigger">
              <span class="font-bold text-sm text-white md:text-base font-display">Quels sont les modes de règlement sécurisés admis ?</span>
              <svg class="w-5 h-5 text-suv-gold transform transition-transform duration-300 faq-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/></svg>
            </button>
            <div class="max-h-0 overflow-hidden transition-all duration-300 ease-in-out faq-answer">
              <div class="p-6 pt-0 text-xs md:text-sm text-suv-gray leading-relaxed font-light border-t border-white/5 bg-white/1">
                Pour assurer la sécurité absolue des transactions, nous acceptons uniquement les virements bancaires Swift ou chèques de banque certifiés issus des établissements financiers agréés au Bénin. Des simulations de leasing/crédit sont gérables via nos correspondants bancaires.
              </div>
            </div>
          </div>

        </div>
      </section>

      <!-- 8. BOTTOM CALL-TO-ACTION VIP BANNER -->
      <section class="max-w-5xl mx-auto px-4 relative z-10">
        <div class="bg-gradient-premium-red border border-white/10 rounded-[32px] p-10 md:p-14 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div class="absolute -right-24 -bottom-24 w-60 h-60 rounded-full bg-suv-gold/10 blur-[60px]"></div>
          
          <div class="max-w-xl mx-auto space-y-4 relative z-10">
            <h3 class="text-2xl md:text-4xl font-extrabold text-white uppercase tracking-tight font-display">
              Vivez l'expérience en privé
            </h3>
            <p class="text-xs md:text-sm text-white/80 leading-relaxed font-light">
              Notre showroom vous accueille pour des présentations privées sur rendez-vous. Discutez en direct avec nos conseillers commerciaux pour planifier un essai.
            </p>
            <div class="pt-6">
              <a href="/catalogue" class="btn-premium-gold hover:shadow-xl text-suv-dark px-10 py-4 rounded-xl font-extrabold text-xs uppercase tracking-wider inline-block" data-link>
                Planifier un essai
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  `;
}

export async function init() {
  const featuredGrid = document.getElementById('featured-grid');
  const quickSearchForm = document.getElementById('quick-search-form');

  // Trigger text sliding animations
  setTimeout(() => {
    const title = document.getElementById('hero-title');
    const desc = document.getElementById('hero-desc');
    const actions = document.getElementById('hero-actions');
    if (title) title.classList.remove('translate-y-4', 'opacity-0');
    if (desc) desc.classList.remove('translate-y-4', 'opacity-0');
    if (actions) actions.classList.remove('translate-y-4', 'opacity-0');
  }, 150);

  // Background slideshow logic
  let activeSlideIdx = 0;
  const slides = document.querySelectorAll('.hero-slide');
  if (slides.length > 0) {
    const slideInterval = setInterval(() => {
      const titleElem = document.getElementById('hero-title');
      if (!titleElem) {
        clearInterval(slideInterval);
        return;
      }
      
      // Transition out
      slides[activeSlideIdx].classList.remove('opacity-100', 'animate-ken-burns');
      slides[activeSlideIdx].classList.add('opacity-0');
      
      activeSlideIdx = (activeSlideIdx + 1) % slides.length;
      
      // Transition in
      slides[activeSlideIdx].classList.remove('opacity-0');
      slides[activeSlideIdx].classList.add('opacity-100', 'animate-ken-burns');
    }, 6000);
  }

  // Benin Testimonials data and slider logic
  const beninTestimonials = [
    {
      name: "Dr. Rodrigue",
      title: "Directeur de Clinique Privée",
      location: "Haie Vive, Cotonou",
      text: "L'achat de mon Land Cruiser s'est fait entièrement en ligne. Une première pour moi à Cotonou. Le service de conciergerie de Vobokun et la livraison VIP à ma clinique ont été d'un professionnalisme exemplaire.",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
      name: "Marius",
      title: "Directeur Import-Export",
      location: "Zone Industrielle de Glo-Djigbé (GDIZ)",
      text: "Trouver un Range Rover en parfait état mécanique avec carnet complet est un défi de taille au Bénin. Vobokun m'a fourni un rapport d'inspection complet de 150 points avant que je ne prenne ma décision. Une transparence absolue.",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    },
    {
      name: "Chantal",
      title: "Fondatrice Tech & Entrepreneuse",
      location: "Fidjrossè, Cotonou",
      text: "Une équipe extrêmement réactive. Négocier le prix de mon véhicule électrique Mercedes EQC en direct via le chat en ligne puis finaliser l'achat à Fidjrossè a été d'une fluidité remarquable. Je recommande vivement !",
      stars: 5,
      avatar: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    }
  ];

  let activeTestimonialIdx = 0;

  function updateTestimonialDOM() {
    const slideContent = document.getElementById('testimonial-slide-content');
    const starsContainer = document.getElementById('testimonial-stars');
    const textElem = document.getElementById('testimonial-text');
    const avatarElem = document.getElementById('testimonial-avatar');
    const nameElem = document.getElementById('testimonial-name');
    const titleElem = document.getElementById('testimonial-title');
    const locElem = document.getElementById('testimonial-location');
    const dotsContainer = document.getElementById('testimonial-dots');

    if (!slideContent || !beninTestimonials[activeTestimonialIdx]) return;

    const data = beninTestimonials[activeTestimonialIdx];

    // Fade out transition
    slideContent.classList.add('opacity-0', 'scale-[0.98]');

    setTimeout(() => {
      // Update contents
      if (starsContainer) {
        starsContainer.innerHTML = Array(data.stars).fill().map(() => `
          <svg class="w-4.5 h-4.5 fill-current" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        `).join('');
      }
      if (textElem) textElem.textContent = `"${data.text}"`;
      if (avatarElem) {
        avatarElem.setAttribute('src', data.avatar);
        avatarElem.setAttribute('alt', data.name);
      }
      if (nameElem) nameElem.textContent = data.name;
      if (titleElem) titleElem.textContent = data.title;
      if (locElem) locElem.textContent = data.location;

      // Update Dot Indicators
      if (dotsContainer) {
        dotsContainer.innerHTML = beninTestimonials.map((_, idx) => `
          <button class="w-2.5 h-2.5 rounded-full transition-all duration-300 focus:outline-none ${idx === activeTestimonialIdx ? 'bg-suv-gold w-6' : 'bg-white/20 hover:bg-white/40'}" data-index="${idx}"></button>
        `).join('');

        // Bind clicks on dots
        dotsContainer.querySelectorAll('button').forEach(btn => {
          btn.addEventListener('click', () => {
            activeTestimonialIdx = parseInt(btn.getAttribute('data-index'));
            updateTestimonialDOM();
          });
        });
      }

      // Fade in transition
      slideContent.classList.remove('opacity-0', 'scale-[0.98]');
    }, 250);
  }

  // Trigger initial testimonial render
  updateTestimonialDOM();

  // Testimonial Carousel Auto-Sliding
  const testimonialInterval = setInterval(() => {
    const contentCheck = document.getElementById('testimonial-slide-content');
    if (!contentCheck) {
      clearInterval(testimonialInterval);
      return;
    }
    activeTestimonialIdx = (activeTestimonialIdx + 1) % beninTestimonials.length;
    updateTestimonialDOM();
  }, 5000);

  // Prev / Next button bindings
  const prevBtn = document.getElementById('prev-testimonial-btn');
  const nextBtn = document.getElementById('next-testimonial-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      activeTestimonialIdx = (activeTestimonialIdx - 1 + beninTestimonials.length) % beninTestimonials.length;
      updateTestimonialDOM();
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      activeTestimonialIdx = (activeTestimonialIdx + 1) % beninTestimonials.length;
      updateTestimonialDOM();
    });
  }

  // FAQ accordion toggle logic
  document.querySelectorAll('.faq-trigger').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const parent = trigger.closest('.faq-item');
      const answer = parent.querySelector('.faq-answer');
      const icon = trigger.querySelector('.faq-icon');
      const isExpanded = answer.style.maxHeight && answer.style.maxHeight !== '0px';

      // Close all other FAQs
      document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== parent) {
          const otherAnswer = item.querySelector('.faq-answer');
          otherAnswer.style.maxHeight = '0px';
          const otherIcon = item.querySelector('.faq-icon');
          otherIcon.style.transform = 'rotate(0deg)';
          otherIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>`;
        }
      });

      // Toggle current FAQ
      if (isExpanded) {
        answer.style.maxHeight = '0px';
        icon.style.transform = 'rotate(0deg)';
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>`;
      } else {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
        icon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>`;
      }
    });
  });

  // Load featured vehicles from service
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
    if (featuredGrid) {
      featuredGrid.innerHTML = `<div class="col-span-full text-center py-8 text-rose-400">Erreur lors du chargement des SUV en vedette.</div>`;
    }
  }

  // Handle Quick Search submissions
  if (quickSearchForm) {
    quickSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const brand = document.getElementById('qs-brand').value;
      const budget = document.getElementById('qs-budget').value;
      
      const newFilters = {};
      if (brand) newFilters.marque = [brand];
      if (budget) newFilters.prixMax = parseFloat(budget);

      store.setFilters(newFilters);
      navigate('/catalogue');
    });
  }

  // Bind Brand Shortcut Buttons click (Logo Cloud links)
  document.querySelectorAll('.brand-shortcut-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const brand = btn.getAttribute('data-brand');
      if (brand) {
        store.setFilters({ marque: [brand] });
        navigate('/catalogue');
      }
    });
  });
}
