# Journal des modifications

Tous les changements notables apportés au projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/), et ce projet adhère au [Versionnage Sémantique](https://semver.org/lang/fr/).

## [Non publié]

### Ajouté
- Fonctionnalité d'authentification pour les administrateurs
- Page de connexion sécurisée
- Intégration de l'API Base Adresse Nationale pour l'autocomplétion des adresses
- Gestion des usagers avec pagination
- Interface de gestion des prêts
- Interface de gestion des articles

### Modifié
- Refonte de l'interface utilisateur avec Material UI
- Optimisation des requêtes pour améliorer les performances

### Corrigé
- Problème d'authentification avec localStorage
- Erreur d'affichage lors de la modification des usagers
- Problème d'importation du module axios

## [0.1.0] - 2025-04-14
### Ajouté
- Configuration initiale du projet Next.js
- Structure de base de données avec Prisma
- Pages principales de l'application
- Mise en place du système d'authentification

## 14 avril 2025

### Corrections de bugs
- Correction de l'erreur React concernant l'attribut `button` non-booléen dans les composants ListItem
- Résolution des erreurs TypeScript liées aux props `item` dans les composants Grid
- Correction du problème de mise en surbrillance des éléments de menu pour les liens Livres et Matériel
- Amélioration de la synchronisation de l'UI lors de la navigation entre les pages avec paramètres de requête

### Modifications techniques
- Refactorisation des composants ListItem pour utiliser ListItemButton conformément aux bonnes pratiques MUI
- Implémentation correcte de useSearchParams() pour la gestion des paramètres d'URL dans la barre latérale
- Mise à jour du composant Items pour réagir correctement aux changements de paramètres d'URL

## 13 avril 2025

### Améliorations et corrections

#### Nouvelles fonctionnalités
- **Page des paramètres** : Ajout d'une nouvelle page de paramètres avec différents onglets pour les configurations (général, notifications, apparence, sécurité, langue)
- **Tuiles cliquables** : Toutes les tuiles statistiques sur le tableau de bord sont maintenant cliquables et redirigent vers les sections correspondantes
- **Navigation améliorée** : Ajout de boutons "Voir tout" aux sections de prêts récents et retours en retard
- **Éléments interactifs** : Les éléments des listes de prêts et retours sont maintenant cliquables pour accéder aux détails

#### Corrections de bugs
- Correction du problème de transmission de la prop personnalisée `isActive` au DOM dans le composant Sidebar en utilisant le système de classes CSS
- Amélioration de la mise en page responsive pour les boutons d'action rapide

### Modifications techniques
- Restructuration du composant `StatCard` pour implémenter des liens et des effets visuels au survol
- Implémentation cohérente des liens Next.js dans toute l'application
- Amélioration de la gestion des paramètres d'URL dans la page des items