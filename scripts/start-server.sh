#!/bin/bash

# Start Server Script for Open Data Dashboard
# This script starts a local web server to serve the website

echo "🚀 Démarrage du serveur web..."
echo ""

# Find an available port
PORT=8000
while netstat -tln 2>/dev/null | grep -q ":$PORT "; do
    PORT=$((PORT + 1))
done

echo "Le dashboard sera accessible à: http://localhost:$PORT"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter le serveur"
echo ""

# Check if Python is available
if command -v python3 &> /dev/null; then
    echo "Utilisation de Python 3"
    cd "$(dirname "$0")/../public"
    python3 -m http.server $PORT
elif command -v python &> /dev/null; then
    echo "Utilisation de Python"
    cd "$(dirname "$0")/../public"
    python -m http.server $PORT
else
    echo "Erreur: Python n'est pas installé"
    echo "Installez Python 3 depuis: https://www.python.org/downloads/"
    exit 1
fi
