// Mock data for SUV Marketplace Demo Mode

export const MOCK_PROFILES = [
  {
    id: "admin-id",
    nom: "Concessionnaire",
    prenom: "Admin",
    telephone: "+229 01 00 00 00 00",
    avatar_url: "https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    role: "admin",
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "user-id-1",
    nom: "Dossou",
    prenom: "Jean",
    telephone: "+229 01 11 11 11 11",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    role: "user",
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "user-id-2",
    nom: "Gbaguidi",
    prenom: "Sophie",
    telephone: "+229 01 22 22 22 22",
    avatar_url: "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
    role: "user",
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

export const MOCK_VEHICLES = [
  {
    id: "suv-1",
    marque: "Toyota",
    modele: "Land Cruiser Prado",
    annee: 2022,
    prix: 42500000, // FCFA
    kilometrage: 45000,
    carburant: "Diesel",
    transmission: "AWD Auto 6 rapports",
    couleur: "Noir Métallisé",
    description: "Toyota Land Cruiser Prado en excellent état. Moteur 4 cylindres diesel robuste et économique. Intérieur cuir, grand écran tactile, caméra de recul, toit ouvrant. Toujours entretenu dans le réseau officiel. Parfait pour la ville et les pistes difficiles.",
    photos: [
      "https://images.unsplash.com/photo-1594568284297-7c64464062b1?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75",
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75"
    ],
    statut: "disponible",
    vues: 245,
    featured: true,
    motorisation: "2.8L D-4D Diesel",
    puissance: "204 ch",
    acceleration: "9.9 s",
    consommation: "7.9 L/100 km",
    places: 7,
    coffre: "640 L",
    couleurs_dispo: "Noir / Blanc Nacré / Gris",
    created_at: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "suv-2",
    marque: "Land Rover",
    modele: "Defender 110 P400e",
    annee: 2023,
    prix: 68000000,
    kilometrage: 12000,
    carburant: "Hybride",
    transmission: "AWD Auto 8 rapports",
    couleur: "Gris Eiger",
    description: "Magnifique Land Rover Defender Hybride Rechargeable (PHEV) de 400ch. Version SE tout équipée. Suspension pneumatique active, toit panoramique, système audio Meridian, jantes 20 pouces noires. Autonomie de 40km en 100% électrique.",
    photos: [
      "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75"
    ],
    statut: "disponible",
    vues: 512,
    featured: true,
    motorisation: "2.0L 4cyl PHEV (Hybride)",
    puissance: "404 ch",
    acceleration: "5.6 s",
    consommation: "3.3 L/100 km",
    places: 5,
    coffre: "740 L",
    couleurs_dispo: "Gris Eiger / Vert Pangea / Noir",
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "suv-3",
    marque: "BMW",
    modele: "X5 xDrive30d M Sport",
    annee: 2021,
    prix: 39900000,
    kilometrage: 68000,
    carburant: "Diesel",
    transmission: "AWD Auto 8 rapports",
    couleur: "Bleu Phonic",
    description: "BMW X5 finition M Sport. Moteur 6 cylindres diesel de 265ch, boîte automatique sport à 8 rapports. Cockpit virtuel, projecteurs Laser, affichage tête haute, sièges chauffants et ventilés. Véhicule première main avec carnet d'entretien complet.",
    photos: [
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75",
      "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75"
    ],
    statut: "disponible",
    vues: 189,
    featured: true,
    motorisation: "3.0L L6 Mild-Hybrid Diesel",
    puissance: "286 ch",
    acceleration: "6.1 s",
    consommation: "6.7 L/100 km",
    places: 5,
    coffre: "650 L",
    couleurs_dispo: "Bleu Phytonic / Noir Cosmos / Blanc Minéral",
    created_at: new Date(Date.now() - 18 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "suv-4",
    marque: "Porsche",
    modele: "Cayenne Coupe S",
    annee: 2022,
    prix: 75000000,
    kilometrage: 23000,
    carburant: "Essence",
    transmission: "AWD Auto 8 rapports",
    couleur: "Blanc Craie",
    description: "Superbe Porsche Cayenne Coupé S motorisé par le V6 2.9L biturbo de 440ch. Pack sport Chrono, échappement sport actif, jantes RS Spyder 21 pouces, intérieur cuir bi-ton étendu. État proche du neuf, aucune rayure, sous garantie Porsche Approved.",
    photos: [
      "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75",
      "https://images.unsplash.com/photo-1611245807189-8c337fed47c0?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75"
    ],
    statut: "disponible",
    vues: 432,
    featured: true,
    motorisation: "2.9L V6 Bi-Turbo Essence",
    puissance: "440 ch",
    acceleration: "5.0 s",
    consommation: "10.4 L/100 km",
    places: 4,
    coffre: "590 L",
    couleurs_dispo: "Blanc Craie / Noir Intense / Gris Quartz",
    created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "suv-5",
    marque: "Jeep",
    modele: "Wrangler Rubicon",
    annee: 2020,
    prix: 28500000,
    kilometrage: 55000,
    carburant: "Essence",
    transmission: "AWD Auto 8 rapports",
    couleur: "Jaune HellaYella",
    description: "Le roi du tout-terrain : Jeep Wrangler finition Rubicon. Ponts Dana 44, blocages de différentiels avant/arrière Tru-Lok, barre stabilisatrice déconnectable. Soft top et hard top inclus. Idéal pour les passionnés d'aventure et de plein air.",
    photos: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75"
    ],
    statut: "disponible",
    vues: 304,
    featured: false,
    motorisation: "2.0L Turbo Essence",
    puissance: "272 ch",
    acceleration: "7.6 s",
    consommation: "9.0 L/100 km",
    places: 5,
    coffre: "533 L",
    couleurs_dispo: "Jaune HellaYella / Gris Granit / Rouge Firecracker",
    created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "suv-6",
    marque: "Audi",
    modele: "Q7 50 TDI quattro",
    annee: 2021,
    prix: 36000000,
    kilometrage: 79000,
    carburant: "Diesel",
    transmission: "AWD Auto 8 rapports",
    couleur: "Gris Daytona",
    description: "Audi Q7 - 7 places. Idéal pour les familles nombreuses. Motorisation V6 MHEV de 286ch avec transmission intégrale permanente quattro. Phares Matrix LED, climatisation automatique 4 zones, cockpit virtuel étendu. Crochet d'attelage électrique.",
    photos: [
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75"
    ],
    statut: "disponible",
    vues: 120,
    featured: false,
    motorisation: "3.0L V6 TDI Mild-Hybrid",
    puissance: "286 ch",
    acceleration: "6.3 s",
    consommation: "7.2 L/100 km",
    places: 7,
    coffre: "865 L",
    couleurs_dispo: "Gris Daytona / Noir Mythic / Blanc Glacier",
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "suv-7",
    marque: "Peugeot",
    modele: "3008 GT Hybrid4",
    annee: 2022,
    prix: 22000000,
    kilometrage: 32000,
    carburant: "Hybride",
    transmission: "AWD Auto 8 rapports",
    couleur: "Bleu Célèbes",
    description: "Peugeot 3008 GT Hybrid4 de 300ch avec 4 roues motrices. Très dynamique et confortable. Toit ouvrant panoramique, sellerie alcantara/cuir, système d'aide à la conduite Drive Assist Plus. Recharge en 1h45 sur borne publique.",
    photos: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75"
    ],
    statut: "vendu",
    vues: 298,
    featured: false,
    motorisation: "1.6L PHEV (Hybride)",
    puissance: "300 ch",
    acceleration: "5.9 s",
    consommation: "1.3 L/100 km",
    places: 5,
    coffre: "395 L",
    couleurs_dispo: "Bleu Célèbes / Gris Platinium / Blanc Nacré",
    created_at: new Date(Date.now() - 45 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "suv-8",
    marque: "Mercedes-Benz",
    modele: "EQC 400 4MATIC",
    annee: 2022,
    prix: 48000000,
    kilometrage: 18000,
    carburant: "Électrique",
    transmission: "AWD Direct Drive 1 rapport",
    couleur: "Argent Iridium",
    description: "SUV 100% électrique Mercedes EQC. Puissance cumulée de 408ch. Autonomie réelle d'environ 360km. Double écran MBUX, commande vocale intelligente, phares adaptatifs Multibeam LED. Silence de conduite exceptionnel.",
    photos: [
      "https://images.unsplash.com/photo-1520050206274-a1ae446cb3cc?auto=format&fit=crop&w=800&auto=format&fit=crop&q=75"
    ],
    statut: "disponible",
    vues: 211,
    featured: false,
    motorisation: "Double Moteur Électrique",
    puissance: "408 ch",
    acceleration: "5.1 s",
    consommation: "21.5 kWh/100 km",
    places: 5,
    coffre: "500 L",
    couleurs_dispo: "Argent Iridium / Noir Obsidienne / Gris Sélénite",
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString()
  }
];

export const MOCK_REQUESTS = [
  {
    id: "req-1",
    user_id: "user-id-1",
    vehicle_id: "suv-1",
    message: "Bonjour, je suis très intéressé par le Toyota Land Cruiser. Est-il possible de faire un essai ce samedi matin ? J'ai un budget disponible immédiatement.",
    prix_propose: 40000000,
    statut: "pending",
    note_admin: "",
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "req-2",
    user_id: "user-id-2",
    vehicle_id: "suv-3",
    message: "Je propose 37 000 000 FCFA payables par chèque de banque pour votre BMW X5. Est-ce acceptable ?",
    prix_propose: 37000000,
    statut: "in_progress",
    note_admin: "En cours de négociation, j'ai proposé 38.5M.",
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "req-3",
    user_id: "user-id-1",
    vehicle_id: "suv-7",
    message: "Bonjour, quel est votre dernier prix pour le Peugeot 3008 GT ?",
    prix_propose: null,
    statut: "refused",
    note_admin: "Véhicule déjà vendu entre-temps.",
    created_at: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  }
];

export const MOCK_MESSAGES = [
  {
    id: "msg-1",
    sender_id: "user-id-1",
    receiver_id: "admin-id",
    vehicle_id: "suv-1",
    contenu: "Bonjour, est-ce que le Toyota Land Cruiser Prado est toujours disponible ?",
    lu: true,
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "msg-2",
    sender_id: "admin-id",
    receiver_id: "user-id-1",
    vehicle_id: "suv-1",
    contenu: "Bonjour Jean, oui tout à fait ! Il est exposé dans notre showroom. Souhaitez-vous planifier une visite ?",
    lu: true,
    created_at: new Date(Date.now() - 2.9 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "msg-3",
    sender_id: "user-id-1",
    receiver_id: "admin-id",
    vehicle_id: "suv-1",
    contenu: "Oui, ce samedi vers 10h si possible. J'ai aussi fait une offre écrite de 40M FCFA.",
    lu: false,
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "msg-4",
    sender_id: "user-id-2",
    receiver_id: "admin-id",
    vehicle_id: "suv-3",
    contenu: "Bonjour, j'ai proposé 37M FCFA pour la BMW X5. Qu'en pensez-vous ?",
    lu: true,
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString()
  },
  {
    id: "msg-5",
    sender_id: "admin-id",
    receiver_id: "user-id-2",
    vehicle_id: "suv-3",
    contenu: "Bonjour Sophie. 37M est un peu bas par rapport au marché, mais nous pourrions couper la poire en deux à 38.5M FCFA.",
    lu: true,
    created_at: new Date(Date.now() - 3.8 * 24 * 3600 * 1000).toISOString()
  }
];

export const MOCK_FAVORITES = [
  { user_id: "user-id-1", vehicle_id: "suv-1" },
  { user_id: "user-id-1", vehicle_id: "suv-3" },
  { user_id: "user-id-2", vehicle_id: "suv-2" }
];
