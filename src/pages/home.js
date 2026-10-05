import { getVehicles } from '../services/vehicles.js';
import { renderVehicleCard, initVehicleCards } from '../components/vehicle-card.js';
import { getFavorites } from '../services/favorites.js';
import { store } from '../store.js';
import { navigate } from '../router.js';

export function render() {
  return `
    <div class="container py-2 animate-fade-in">
      
      <!-- 1. EDITORIAL HERO SHOWROOM -->
      <section class="card toyota-card-dark position-relative overflow-hidden p-4 p-md-5 mb-5 border-0 shadow-lg">
        
        <!-- Background Image with Toyota High-Contrast Dark Gradient Overlay -->
        <div class="position-absolute top-0 start-0 w-100 h-100 z-0">
          <img 
            src="https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1280&q=75" 
            alt="Showroom Vobokun" 
            class="w-100 h-100 object-fit-cover object-position-center opacity-40"
            loading="eager"
            fetchpriority="high"
          />
          <div class="position-absolute top-0 start-0 w-100 h-100" style="background: linear-gradient(90deg, #0A0A0A 0%, rgba(10,10,10,0.85) 60%, rgba(10,10,10,0.4) 100%);"></div>
        </div>

        <!-- Hero Content -->
        <div class="position-relative z-2 py-4 py-lg-5" style="max-width: 680px;">
          
          <div class="d-inline-flex align-items-center gap-2 badge bg-danger text-white text-uppercase px-3 py-2 fw-black font-display mb-3 rounded-2 shadow-sm">
            <span class="spinner-grow spinner-grow-sm text-light" style="width: 8px; height: 8px;" role="status"></span>
            SHOWROOM OFFICIEL &middot; COTONOU
          </div>
          
          <h1 class="display-4 fw-black font-display text-white text-uppercase mb-3 tracking-tight lh-1">
            L'Excellence SUV <br>
            <span class="text-danger">Certifiée & Garantie.</span>
          </h1>
          
          <p class="lead text-white text-opacity-75 mb-4 fw-normal" style="font-size: 1.05rem; line-height: 1.6;">
            Accédez à une sélection exclusive de SUV prestigieux rigoureusement inspectés sur 150 points. Négociation directe avec la concession, traçabilité certifiée et livraison clé en main.
          </p>
          
          <div class="d-flex flex-wrap align-items-center gap-3 mb-5">
            <a href="/catalogue" class="btn-toyota-red px-4 py-3" data-link>
              <span>Explorer la Collection</span>
              <i class="bi bi-arrow-right fs-6"></i>
            </a>
            <a href="#express-finance" class="btn-toyota-outline-white px-4 py-3">
              <i class="bi bi-calculator text-danger fs-6"></i>
              <span>Simuler Financement</span>
            </a>
          </div>

          <!-- Quick Proof Points -->
          <div class="pt-4 border-top border-secondary border-opacity-25 row g-4">
            <div class="col-4">
              <div class="fs-4 fw-black font-display text-white">150<span class="text-danger">+</span></div>
              <div class="text-white text-opacity-50 small fw-bold text-uppercase" style="font-size: 0.7rem;">Points Contrôlés</div>
            </div>
            <div class="col-4 border-start border-secondary border-opacity-25">
              <div class="fs-4 fw-black font-display text-white">12 <span class="text-danger">Mois</span></div>
              <div class="text-white text-opacity-50 small fw-bold text-uppercase" style="font-size: 0.7rem;">Garantie Réseau</div>
            </div>
            <div class="col-4 border-start border-secondary border-opacity-25">
              <div class="fs-4 fw-black font-display text-white">0 <span class="text-danger">Délai</span></div>
              <div class="text-white text-opacity-50 small fw-bold text-uppercase" style="font-size: 0.7rem;">Essai Immédiat</div>
            </div>
          </div>

        </div>
      </section>

      <!-- 2. QUICK SEARCH DECK -->
      <section class="container px-0 mb-5" style="margin-top: -3.5rem; position: relative; z-index: 10;">
        <div class="card toyota-card p-4 p-md-4 shadow-lg border-2">
          <form id="quick-search-form" class="row g-3 align-items-end">
            
            <!-- Brand -->
            <div class="col-12 col-md-3">
              <label class="toyota-spec-label mb-1.5"><i class="bi bi-car-front text-danger me-1"></i>Marque</label>
              <select id="qs-brand" class="form-select toyota-input">
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
            <div class="col-12 col-md-3">
              <label class="toyota-spec-label mb-1.5"><i class="bi bi-cash-stack text-danger me-1"></i>Budget Max</label>
              <select id="qs-budget" class="form-select toyota-input">
                <option value="">Tous les budgets</option>
                <option value="30000000">Jusqu'à 30 000 000 FCFA</option>
                <option value="50000000">Jusqu'à 50 000 000 FCFA</option>
                <option value="75000000">Jusqu'à 75 000 000 FCFA</option>
                <option value="100000000">100 000 000 FCFA et +</option>
              </select>
            </div>

            <!-- Energy / Fuel -->
            <div class="col-12 col-md-3">
              <label class="toyota-spec-label mb-1.5"><i class="bi bi-fuel-pump text-danger me-1"></i>Motorisation</label>
              <select id="qs-carburant" class="form-select toyota-input">
                <option value="">Toutes énergies</option>
                <option value="Diesel">Diesel</option>
                <option value="Essence">Essence</option>
                <option value="Hybride">Hybride (PHEV)</option>
                <option value="Électrique">100% Électrique</option>
              </select>
            </div>
            
            <!-- Submit Button -->
            <div class="col-12 col-md-3">
              <button type="submit" class="btn-toyota-red w-100 justify-content-center py-2.5">
                <i class="bi bi-search"></i>
                <span>Rechercher</span>
              </button>
            </div>

          </form>
        </div>
      </section>

      <!-- 3. BRAND PILLS CLOUD -->
      <section class="text-center my-5 py-3">
        <span class="text-danger fw-bold small text-uppercase font-display tracking-widest d-block mb-1">Constructeurs Officiels</span>
        <h2 class="h3 fw-black text-dark font-display text-uppercase mb-4">Sélections Privilèges</h2>
        
        <div class="d-flex flex-wrap justify-content-center gap-2">
          <button class="brand-shortcut-btn btn btn-outline-dark fw-bold text-uppercase px-4 py-2 rounded-3" data-brand="Toyota">Toyota</button>
          <button class="brand-shortcut-btn btn btn-outline-dark fw-bold text-uppercase px-4 py-2 rounded-3" data-brand="Land Rover">Land Rover</button>
          <button class="brand-shortcut-btn btn btn-outline-dark fw-bold text-uppercase px-4 py-2 rounded-3" data-brand="BMW">BMW</button>
          <button class="brand-shortcut-btn btn btn-outline-dark fw-bold text-uppercase px-4 py-2 rounded-3" data-brand="Porsche">Porsche</button>
          <button class="brand-shortcut-btn btn btn-outline-dark fw-bold text-uppercase px-4 py-2 rounded-3" data-brand="Mercedes-Benz">Mercedes-Benz</button>
          <button class="brand-shortcut-btn btn btn-outline-dark fw-bold text-uppercase px-4 py-2 rounded-3" data-brand="Audi">Audi</button>
          <button class="brand-shortcut-btn btn btn-outline-dark fw-bold text-uppercase px-4 py-2 rounded-3" data-brand="Jeep">Jeep</button>
        </div>
      </section>

      <!-- 4. FEATURED SHOWROOM (VEHICULES EN VEDETTE) -->
      <section class="my-5">
        <div class="d-flex justify-content-between align-items-end pb-3 border-bottom mb-4">
          <div>
            <span class="text-danger fw-bold small text-uppercase font-display tracking-widest d-block">Collection Exclusive</span>
            <h2 class="h3 fw-black text-dark font-display text-uppercase mb-0 mt-1">Dernières Arrivées en Showroom</h2>
          </div>
          <a href="/catalogue" class="text-danger fw-bold text-uppercase small text-decoration-none d-inline-flex align-items-center gap-1" data-link>
            <span>Voir toute la flotte</span>
            <i class="bi bi-arrow-right"></i>
          </a>
        </div>

        <!-- Featured vehicles grid -->
        <div id="home-featured-grid" class="row g-4">
          <div class="col-12 text-center py-5 text-muted">Chargement instantané des véhicules...</div>
        </div>
      </section>

      <!-- 5. INTERACTIVE EXPRESS FINANCING CALCULATOR -->
      <section id="express-finance" class="card toyota-card-dark p-4 p-md-5 my-5 shadow-xl border-0 overflow-hidden position-relative">
        <div class="row g-5 align-items-center position-relative z-2">
          
          <div class="col-lg-7">
            <span class="badge bg-danger text-uppercase px-3 py-1.5 fw-bold font-display mb-2">Simulateur Direct</span>
            <h2 class="h2 fw-black text-white font-display text-uppercase mb-3">Financement Sur-Mesure</h2>
            <p class="text-white text-opacity-75 small mb-4 lh-lg">
              Estimez vos mensualités en ajustant le prix du véhicule et votre apport. Obtenez un accord de principe en moins de 24h avec nos partenaires bancaires certifiés.
            </p>

            <div class="d-flex flex-column gap-4">
              
              <!-- Vehicle Price Slider -->
              <div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="text-white text-opacity-75 small fw-bold text-uppercase">Prix du Véhicule</span>
                  <span class="fs-5 fw-black text-danger font-display" id="calc-price-label">42 500 000 FCFA</span>
                </div>
                <input type="range" id="calc-price-slider" min="15000000" max="85000000" step="500000" value="42500000" class="toyota-range">
              </div>

              <!-- Down Payment Slider -->
              <div>
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="text-white text-opacity-75 small fw-bold text-uppercase">Apport Initial (20%)</span>
                  <span class="fs-5 fw-black text-danger font-display" id="calc-down-label">8 500 000 FCFA</span>
                </div>
                <input type="range" id="calc-down-slider" min="10" max="50" step="5" value="20" class="toyota-range">
              </div>

              <!-- Duration Selector -->
              <div>
                <span class="text-white text-opacity-75 small fw-bold text-uppercase d-block mb-2">Durée du Financement</span>
                <div class="row g-2">
                  <div class="col-3"><button type="button" class="calc-dur-btn btn btn-outline-light w-100 fw-bold small py-2" data-months="24">24 mois</button></div>
                  <div class="col-3"><button type="button" class="calc-dur-btn btn btn-outline-light w-100 fw-bold small py-2" data-months="36">36 mois</button></div>
                  <div class="col-3"><button type="button" class="calc-dur-btn btn btn-danger w-100 fw-bold small py-2" data-months="48">48 mois</button></div>
                  <div class="col-3"><button type="button" class="calc-dur-btn btn btn-outline-light w-100 fw-bold small py-2" data-months="60">60 mois</button></div>
                </div>
              </div>

            </div>
          </div>

          <!-- Result Card -->
          <div class="col-lg-5">
            <div class="card bg-dark border border-secondary border-opacity-25 rounded-4 p-4 p-md-5 text-center text-white shadow-lg">
              <span class="text-white text-opacity-50 small fw-bold text-uppercase" style="letter-spacing: 0.1em;">Mensualité Estimée</span>
              <div class="display-5 fw-black text-danger font-display my-2" id="calc-monthly-result">
                798 500 FCFA
              </div>
              <div class="small text-white text-opacity-50 mb-4">/ mois (hors assurance facultative)</div>

              <div class="py-3 border-top border-secondary border-opacity-25 small text-white text-opacity-75 text-start mb-4">
                <div class="d-flex justify-content-between mb-2">
                  <span>Montant financé :</span>
                  <span class="text-white fw-bold" id="calc-financed-amount">34 000 000 FCFA</span>
                </div>
                <div class="d-flex justify-content-between">
                  <span>Taux indicatif :</span>
                  <span class="text-white fw-bold">5.9% T.A.E.G.</span>
                </div>
              </div>

              <a href="/catalogue" class="btn-toyota-red w-100 justify-content-center py-3" data-link>
                Choisir un véhicule éligible
              </a>
            </div>
          </div>

        </div>
      </section>

      <!-- 6. THE VOBOKUN STANDARD (BENTO GRID) -->
      <section class="my-5">
        <div class="text-center mb-5">
          <span class="text-danger fw-bold small text-uppercase font-display tracking-widest d-block">Engagements Concessionnaire</span>
          <h2 class="h2 fw-black text-dark font-display text-uppercase mt-1">Le Standard Corporate Vobokun</h2>
        </div>

        <div class="row g-4">
          
          <div class="col-12 col-md-6 col-lg-3">
            <div class="card toyota-card h-100 p-4">
              <div class="rounded-3 bg-danger bg-opacity-10 text-danger p-3 d-inline-flex align-items-center justify-content-center mb-3" style="width: 52px; height: 52px;">
                <i class="bi bi-shield-check fs-4"></i>
              </div>
              <h3 class="h6 fw-black text-dark font-display text-uppercase mb-2">Audit 150 Points</h3>
              <p class="text-muted small mb-0 lh-base">
                Moteur, châssis, transmission, électronique et train roulant inspectés par nos experts certifiés.
              </p>
            </div>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <div class="card toyota-card h-100 p-4">
              <div class="rounded-3 bg-danger bg-opacity-10 text-danger p-3 d-inline-flex align-items-center justify-content-center mb-3" style="width: 52px; height: 52px;">
                <i class="bi bi-chat-dots fs-4"></i>
              </div>
              <h3 class="h6 fw-black text-dark font-display text-uppercase mb-2">Négociation Directe</h3>
              <p class="text-muted small mb-0 lh-base">
                Échangez en direct avec la concession et formulez vos contre-offres de prix en temps réel.
              </p>
            </div>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <div class="card toyota-card h-100 p-4">
              <div class="rounded-3 bg-danger bg-opacity-10 text-danger p-3 d-inline-flex align-items-center justify-content-center mb-3" style="width: 52px; height: 52px;">
                <i class="bi bi-arrow-repeat fs-4"></i>
              </div>
              <h3 class="h6 fw-black text-dark font-display text-uppercase mb-2">Reprise Cash</h3>
              <p class="text-muted small mb-0 lh-base">
                Faites estimer votre véhicule actuel en ligne et déduisez sa valeur immédiatement de votre acquisition.
              </p>
            </div>
          </div>

          <div class="col-12 col-md-6 col-lg-3">
            <div class="card toyota-card h-100 p-4">
              <div class="rounded-3 bg-danger bg-opacity-10 text-danger p-3 d-inline-flex align-items-center justify-content-center mb-3" style="width: 52px; height: 52px;">
                <i class="bi bi-award fs-4"></i>
              </div>
              <h3 class="h6 fw-black text-dark font-display text-uppercase mb-2">Garantie 12 Mois</h3>
              <p class="text-muted small mb-0 lh-base">
                Couverture pièces et main d'œuvre valable dans l'ensemble du réseau agréé sur tout le territoire.
              </p>
            </div>
          </div>

        </div>
      </section>

      <!-- 7. CLIENT TESTIMONIALS -->
      <section class="card toyota-panel text-center p-4 p-md-5 my-5">
        <span class="text-danger fw-bold small text-uppercase font-display tracking-widest d-block mb-1">Avis Membres</span>
        <h2 class="h3 fw-black text-dark font-display text-uppercase mb-4">Ils ont Choisi Vobokun</h2>

        <div id="testimonial-slide-content" class="py-2" style="max-width: 720px; margin: 0 auto;">
          <div class="text-danger mb-3 fs-5" id="testimonial-stars"></div>
          <blockquote class="fs-5 text-dark fw-medium fst-italic mb-4" id="testimonial-text"></blockquote>
          <div class="d-flex align-items-center justify-content-center gap-3">
            <img id="testimonial-avatar" src="" alt="Client" class="rounded-circle border border-2 border-danger" style="width: 50px; height: 50px; object-fit: cover;">
            <div class="text-start">
              <div class="fw-black text-dark" id="testimonial-name"></div>
              <div class="small text-danger fw-bold" id="testimonial-title"></div>
              <div class="small text-muted" id="testimonial-location" style="font-size: 0.72rem;"></div>
            </div>
          </div>
        </div>

        <div class="d-flex justify-content-center align-items-center gap-3 mt-4">
          <button id="prev-testimonial-btn" class="btn btn-sm btn-outline-dark rounded-circle p-2" style="width: 36px; height: 36px;">
            <i class="bi bi-chevron-left"></i>
          </button>
          <div id="testimonial-dots" class="d-flex gap-1.5"></div>
          <button id="next-testimonial-btn" class="btn btn-sm btn-outline-dark rounded-circle p-2" style="width: 36px; height: 36px;">
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      </section>

      <!-- 8. FAQ ACCORDION -->
      <section class="my-5" style="max-width: 820px; margin-left: auto; margin-right: auto;">
        <div class="text-center mb-4">
          <span class="text-danger fw-bold small text-uppercase font-display tracking-widest d-block">Questions Fréquentes</span>
          <h2 class="h3 fw-black text-dark font-display text-uppercase">Tout ce que vous devez savoir</h2>
        </div>

        <div class="accordion toyota-card overflow-hidden" id="faqAccordion">
          
          <div class="accordion-item border-0 border-bottom">
            <h2 class="accordion-header">
              <button class="accordion-button fw-bold text-dark collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                Comment se déroule la réservation et l'essai d'un véhicule ?
              </button>
            </h2>
            <div id="faq1" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
              <div class="accordion-body small text-muted lh-base">
                Il vous suffit de cliquer sur "Réserver un essai" sur la fiche du SUV ou de nous contacter via le chat. Notre showroom de Cotonou (Haie Vive) met le véhicule à votre disposition à la date convenue avec un conseiller dédié.
              </div>
            </div>
          </div>

          <div class="accordion-item border-0 border-bottom">
            <h2 class="accordion-header">
              <button class="accordion-button fw-bold text-dark collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                Puis-je négocier le prix affiché ?
              </button>
            </h2>
            <div id="faq2" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
              <div class="accordion-body small text-muted lh-base">
                Absolument. Vous disposez d'un bouton "Faire une offre de prix" sur chaque fiche véhicule. Votre proposition est transmise instantanément au responsable du showroom qui peut l'accepter, la refuser ou formuler une contre-offre.
              </div>
            </div>
          </div>

          <div class="accordion-item border-0">
            <h2 class="accordion-header">
              <button class="accordion-button fw-bold text-dark collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                Tous les véhicules sont-ils garantis ?
              </button>
            </h2>
            <div id="faq3" class="accordion-collapse collapse" data-bs-parent="#faqAccordion">
              <div class="accordion-body small text-muted lh-base">
                Oui, chaque SUV certifié Vobokun fait l'objet d'un contrôle rigoureux de 150 points et s'accompagne d'une garantie minimum de 12 mois couvrant le moteur, la boîte de vitesses et les composants majeurs.
              </div>
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
        featuredGrid.innerHTML = `<div class="col-12 text-center py-5 text-muted">Aucun véhicule vedette disponible.</div>`;
      } else {
        featuredGrid.innerHTML = vehicles.map(v => `<div class="col-12 col-md-6 col-lg-4">${renderVehicleCard(v, favIds.includes(v.id))}</div>`).join('');
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
  const durButtons = document.querySelectorAll('.calc-dur-btn');
  const monthlyResult = document.getElementById('calc-monthly-result');
  const financedAmountEl = document.getElementById('calc-financed-amount');

  let activeDuration = 48;
  const currency = localStorage.getItem('suv_site_currency') || 'FCFA';

  const updateFinanceCalculation = () => {
    if (!priceSlider || !downSlider || !monthlyResult) return;
    const price = parseFloat(priceSlider.value);
    const downPct = parseFloat(downSlider.value) / 100;
    const downAmount = price * downPct;
    const financed = price - downAmount;

    priceLabel.textContent = `${new Intl.NumberFormat('fr-FR').format(price)} ${currency}`;
    downLabel.textContent = `${new Intl.NumberFormat('fr-FR').format(downAmount)} ${currency}`;
    if (financedAmountEl) {
      financedAmountEl.textContent = `${new Intl.NumberFormat('fr-FR').format(financed)} ${currency}`;
    }

    const r = 0.059 / 12; // 5.9% annual
    const monthly = Math.round(financed * (r / (1 - Math.pow(1 + r, -activeDuration))));
    monthlyResult.textContent = `${new Intl.NumberFormat('fr-FR').format(monthly)} ${currency}`;
  };

  if (priceSlider) priceSlider.addEventListener('input', updateFinanceCalculation);
  if (downSlider) downSlider.addEventListener('input', updateFinanceCalculation);

  durButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      durButtons.forEach(b => {
        b.className = 'calc-dur-btn btn btn-outline-light w-100 fw-bold small py-2';
      });
      btn.className = 'calc-dur-btn btn btn-danger w-100 fw-bold small py-2';
      activeDuration = parseInt(btn.getAttribute('data-months'));
      updateFinanceCalculation();
    });
  });

  // Testimonials Carousel Logic
  const testimonials = [
    {
      name: "Aurélien K.",
      title: "Directeur Général &middot; Cotonou",
      location: "Toyota Land Cruiser LC300 GR Sport",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      text: "« Un niveau d'accompagnement digne des plus grands standards internationaux. Le véhicule a été inspecté et livré directement à mon bureau avec l'ensemble des documents en règle en moins de 48h. »"
    },
    {
      name: "Sonia D.",
      title: "Avocate Associée &middot; Haie Vive",
      location: "BMW X5 xDrive45e Hybride",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      text: "« La négociation directe via le chat avec le directeur de concession m'a permis de faire une proposition juste et validée instantanément. C'est le futur de l'achat automobile au Bénin. »"
    },
    {
      name: "Marc-Antoine T.",
      title: "Entrepreneur &middot; Cadjehoun",
      location: "Porsche Cayenne E-Hybrid",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      text: "« Véhicule d'une propreté clinique, historique d'entretien limpide et reprise immédiate de mon ancien SUV à un tarif très compétitif. Vobokun est désormais ma référence absolue. »"
    }
  ];

  let currentTestimonialIdx = 0;
  const starsContainer = document.getElementById('testimonial-stars');
  const textEl = document.getElementById('testimonial-text');
  const avatarEl = document.getElementById('testimonial-avatar');
  const nameEl = document.getElementById('testimonial-name');
  const titleEl = document.getElementById('testimonial-title');
  const locEl = document.getElementById('testimonial-location');
  const dotsContainer = document.getElementById('testimonial-dots');

  const renderTestimonial = (idx) => {
    const t = testimonials[idx];
    if (!t || !textEl) return;

    if (starsContainer) {
      starsContainer.innerHTML = '★'.repeat(t.rating);
    }
    textEl.textContent = t.text;
    if (avatarEl) avatarEl.src = t.avatar;
    if (nameEl) nameEl.textContent = t.name;
    if (titleEl) titleEl.innerHTML = t.title;
    if (locEl) locEl.textContent = t.location;

    if (dotsContainer) {
      dotsContainer.innerHTML = testimonials.map((_, i) => `
        <span class="rounded-pill transition-all" style="width: ${i === idx ? '24px' : '8px'}; height: 8px; background-color: ${i === idx ? 'var(--toyota-red)' : 'var(--toyota-border)'}; display: inline-block;"></span>
      `).join('');
    }
  };

  renderTestimonial(0);

  const prevBtn = document.getElementById('prev-testimonial-btn');
  const nextBtn = document.getElementById('next-testimonial-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      currentTestimonialIdx = (currentTestimonialIdx - 1 + testimonials.length) % testimonials.length;
      renderTestimonial(currentTestimonialIdx);
    });
  }
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      currentTestimonialIdx = (currentTestimonialIdx + 1) % testimonials.length;
      renderTestimonial(currentTestimonialIdx);
    });
  }

  // Accordion toggle fallback
  document.querySelectorAll('#faqAccordion .accordion-button').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = document.querySelector(btn.getAttribute('data-bs-target'));
      if (target) {
        const isCollapsed = target.classList.contains('show');
        document.querySelectorAll('#faqAccordion .accordion-collapse').forEach(c => c.classList.remove('show'));
        document.querySelectorAll('#faqAccordion .accordion-button').forEach(b => b.classList.add('collapsed'));
        if (!isCollapsed) {
          target.classList.add('show');
          btn.classList.remove('collapsed');
        }
      }
    });
  });
}
