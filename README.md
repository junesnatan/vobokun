# Vobokun - Plateforme d'Achat & Vente de Véhicules d'Occasion

Vobokun est une application web moderne et réactive conçue pour faciliter la recherche, la comparaison, la négociation et l'achat de véhicules d'occasion certifiés.

##  Fonctionnalités Clés

- **Catalogue & Recherche Intelligente** : Filtres avancés (marque, modèle, prix, carburant, boîte, kilométrage, année).
- **Fiches Véhicules Détaillées** : Galeries photos, caractéristiques techniques, simulateur de financement en temps réel, demande d'essai et réservation.
- **Comparateur de Véhicules** : Comparaison côte à côte des équipements et spécifications.
- **Messagerie & Négociation en Direct** : Canal de discussion interactif entre acheteurs et concessionnaire avec offres de prix.
- **Espace Client (Dashboard Utilisateur)** : Suivi des offres, demandes de reprise/essai, véhicules favoris et historique.
- **Espace Administrateur (`/admin`)** :
  - Métriques clés (KPIs, ventes, vues, demandes).
  - Gestion du stock (Ajout, modification, suppression, export et import Excel/XLSX).
  - Gestion des requêtes clients et messagerie centralisée.
- **Mode Sombre / Clair** : Thème personnalisable avec persistance locale.
- **Architecture Résiliente** : Fonctionnement hybride ultra-rapide avec cache local et synchronisation Firebase Firestore.

##  Technologies

- **Frontend** : Vanilla JS (ES Modules) ultra-optimisé, Vite 8, Tailwind CSS 3.4
- **Backend / Stockage** : Firebase (Firestore, Auth), LocalStorage pour le mode hors-ligne
- **Outils** : SheetJS (Import/Export Excel à la demande)

##  Installation & Démarrage

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/junesnatan/vobokun.git
   cd vobokun
   ```

2. **Installer les dépendances** :
   ```bash
   npm install
   ```

3. **Variables d'environnement** :
   Copier le fichier `.env.example` en `.env` :
   ```bash
   cp .env.example .env
   ```

4. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```

5. **Compiler pour la production** :
   ```bash
   npm run build
   ```

##  Licence
Projet propriétaire - Tous droits réservés.
