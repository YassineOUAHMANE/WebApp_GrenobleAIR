#!/bin/bash

set -e
# Création de la structure de dossiers
mkdir -p {css,js/{utils,views},data/{parking,mobilite_douce,zfe,irve,qualite_air,metadata},assets/{icons,images,logos}}


# Création des fichiers principaux
touch index.html README.md
touch css/{style.css,layout.css,theme.css}
touch js/{main.js,router.js}
touch js/utils/{fetchData.js,mapUtils.js,chartUtils.js}
touch js/views/{dashboardView.js,parkingView.js,mobiliteView.js,zfeView.js,irveView.js,qualiteAirView.js,aboutView.js}