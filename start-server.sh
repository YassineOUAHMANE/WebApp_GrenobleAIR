#!/bin/bash

# Start Server Script for Open Data Dashboard
# This script starts a local web server to serve the website

echo "Démarrage du serveur web..."
echo ""
echo "Le dashboard sera accessible à: http://localhost:8000"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Utilisation de Python 3"
    cd "$(dirname "$0")/public"
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Utilisation de Python"
    cd "$(dirname "$0")/public"
    python -m http.server 8000
else
    echo "Erreur: Python n'est pas installé"
    echo "Installez Python 3 depuis: https://www.python.org/downloads/"
    exit 1
fi
