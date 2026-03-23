#!/bin/bash
# Script de déploiement — à lancer sur le VPS après git pull
set -e

echo "=== Déploiement Planning App ==="

# Backend
echo "→ Installation des dépendances backend..."
cd backend
npm install --omit=dev
cd ..

# Frontend
echo "→ Build du frontend..."
cd frontend
npm install
npm run build
cd ..

# Redémarrer le serveur
echo "→ Redémarrage du serveur..."
pm2 restart planning-app || pm2 start ecosystem.config.cjs

echo "✓ Déploiement terminé !"
