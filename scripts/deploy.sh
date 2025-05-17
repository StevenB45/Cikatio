#!/bin/bash

# Arrêter le script en cas d'erreur
set -e

echo "🚀 Démarrage du déploiement..."

# Nettoyer les caches
echo "🧹 Nettoyage des caches..."
npm run cleanup

# Installer les dépendances
echo "📦 Installation des dépendances..."
npm install

# Générer les types Prisma
echo "🔧 Génération des types Prisma..."
npm run prisma:generate

# Appliquer les migrations de la base de données
echo "🔄 Application des migrations..."
npm run prisma:deploy

# Construire l'application
echo "🏗️ Construction de l'application..."
npm run build:prod

# Démarrer l'application
echo "🚀 Démarrage de l'application..."
npm run start:prod

echo "✅ Déploiement terminé avec succès!" 