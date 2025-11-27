import { icons } from '../utils/icons.js';

export default {
  title: 'À propos',
  icon: 'info',
  async mount(root) {
    root.innerHTML = `
    <h2 class="title">À propos du Projet</h2>
    
    <section class="grid">
      <!-- Équipe -->
      <div class="span-12 card">
        <h2>${icons.user} Équipe</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
          
          <div style="padding: 1rem; background: rgba(79, 124, 255, 0.05); border-radius: 8px; border-left: 3px solid #4f7cff;">
            <h3 style="margin: 0; font-size: 1.1rem;">${icons.user} Yassine OUAHMANE</h3>
          </div>

          <div style="padding: 1rem; background: rgba(41, 193, 140, 0.05); border-radius: 8px; border-left: 3px solid #29c18c;">
            <h3 style="margin: 0; font-size: 1.1rem;">${icons.user} Lisa BANIHACHEMI</h3>
          </div>

          <div style="padding: 1rem; background: rgba(255, 209, 102, 0.05); border-radius: 8px; border-left: 3px solid #ffd166;">
            <h3 style="margin: 0; font-size: 1.1rem;">${icons.user} Felix RUNQUIST</h3>
          </div>

          <div style="padding: 1rem; background: rgba(236, 72, 153, 0.05); border-radius: 8px; border-left: 3px solid #ec4899;">
            <h3 style="margin: 0; font-size: 1.1rem;">${icons.user} Baptiste CONTENT</h3>
          </div>

        </div>
      </div>  
    
    <!-- Description & objectifs du projet-->
      <div class="span-12 card">
        <h2><strong>MOBIL'AIR</strong> Grenoble</h2>
        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">
        <p>L'objectif de notre projet est de proposer une application interactive, permettant aux Grenoblois, touristes, ainsi qu'aux décideurs locaux (mairie, métropole, ...) de mieux comprendre comment ils peuvent se déplacer à Grenoble, comment sont équipées les différentes zones de la ville, et quels impacts les différentes mobilitées peuvent avoir. </p>
        <p>Pour réaliser notre projet, nous allons donc utiliser une carte avec différents réseaux et des zones cliquables. Nous avons laissé la possibilité à l'utilisateur de selectionner certains types de données par exemple, pour rendre la carte le plus interractive et personnalisée.</p>
        <p>De plus, notre application est responsive, donc elle s'adapte à la fenêtre utilisateurs et il peut choisir de passer la page en dark mode. </p>
      </div>

      <!-- Traitement des Données -->
      <div class="span-12 card">
        <h2>Traitement des Données</h2>
        <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">
          <h3 style="margin-top: 0; margin-bottom: 0.5rem;">Sources de données :</h3>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><strong>Stationnement:</strong> Données de disponibilité temps réel, capacités, tarification</li>
            <li><strong>Transport public:</strong> Lignes de transport en commun (TAG), itinéraires</li>
            <li><strong>Mobilité douce:</strong> Comptages vélos, pistes cyclables, arceaux</li>
            <li><strong>Véhicules électriques:</strong> Stations de recharge IRVE (Infrastructure de Recharge)</li>
            <li><strong>Zones ZFE:</strong> Périmètres et axes des zones à faibles émissions</li>
            <li><strong>Qualité de l'air:</strong> Données de qualité atmosphérique et pollution</li>
          </ul>
          
          <h3 style="margin-top: 1rem; margin-bottom: 0.5rem;">Pipeline de traitement :</h3>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><strong>Nettoyage:</strong> Normalisation des formats CSV, suppression des doublons</li>
            <li><strong>Validation:</strong> Vérification de la cohérence et de la complétude des données</li>
            <li><strong>Compression:</strong> Optimisation en GZIP (77% de réduction d'espace) pour rapidité de chargement</li>
            <li><strong>Intégration:</strong> Fusion de sources multiples avec harmonisation des schémas</li>
            <li><strong>Visualisation:</strong> Présentation interactive via D3.js et cartes interactives</li>
          </ul>
        </div>
      </div>

      <!-- Démarches -->
      <div class="span-12 card">
        <h2>Démarches et Méthodologie</h2>
        <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">
          <ol style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><strong>Audit des données disponibles:</strong> Identification des sources ouvertes et propriétaires</li>
            <li><strong>Conception de l'architecture:</strong> Modélisation du système de visualisation</li>
            <li><strong>Développement du pipeline:</strong> Scripts Python pour organisation,transformation,cleaning de données</li>
            <li><strong>Création de l'interface:</strong> Tableaux de bord interactifs et responsifs</li>
            <li><strong>Visualisations analytiques:</strong> Graphiques, cartes, bulles et statistiques</li>
            <li><strong>Optimisation performance:</strong> Réduction de la taille des données, mise en cache</li>
            <li><strong>Documentation et déploiement:</strong> Guide utilisateur et mise en ligne</li>
          </ol>
        </div>
      </div>

      <! -- Choix des visualisations -->
      <div class="span-12 card">
        <h2>Choix de Visualisations</h2>
        <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">
          <h3 style="margin-top: 0; margin-bottom: 0.5rem;">1. Carte Interactive : </h3>
          <p> Les données que nous voulons afficher sont géolocalisées, comme les lignes de transport ou encore les pistes cyclables. Nous avons donc opté pour une carte sur la page principale de notre application. </p>
          <p> La position géographique permet une lecture simple et claire pour les différents utilisateurs, en leur apportant directement la vision "où" et l'analyse simple de la structure des mobilitées à Grenoble. </p>
          <p> Notre application ayant pour contrainte une taille de 10Mo max imposés, le choix d'utiliser une carte vectorielle nous a paru le plus juste pour afficher un grand nombre de données sans surcharger la page, tout en conservant une bonne lisibilité de la carte. Les vecteurs permettent un rendu net sur plusieurs niveaux de zooms.</p>
          <h3 style="margin-top: 1rem; margin-bottom: 0.5rem;">2. Représentation des données sur la carte :</h3>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><h4>Données linéaires : bus et tram </h4></li>
          </ul>
          <p>Pour les lignes de transport en commun, nous avons choisi d'afficher les lignes de bus et tram sous forme de lignes colorées sur la carte. Chaque ligne est représentée par une couleur distincte, facilitant ainsi l'identification des différentes routes.
              Cette représentation linéaire permet aux utilisateurs de comprendre rapidement le réseau de transport en commun et d'identifier les connexions entre les différentes lignes.</p>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><h4>Données ponctuelles : parkings, compteurs vélos, arceaux vélo, bornes de recharge, flux voiture et vélo</h4></li>
          </ul>
          <p>Les bornes et les différents équipements sont localisés sur des points précis dans Grenoble. Nous allons donc les représenter par des cercles de différentes couleurs et diamètre, en fonction de leur capacité. Cela permet à l'utilisateur de notre application une identification simple et quasi-immédiate tout en conservant la lisiblité de la carte.</p>
          <p>L'utilisateur peut cliquer sur ces points pour obtenir plus d'informations, comme le nombre de places disponibles dans un parking.</p>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><h4>Qualité de l'Air à Grenoble</h4></li>
          </ul>
          <p> L'indice ATMO est une donnéee quantitative, que l'on va représenter par l'ajout de variation de couleurs (du bleu/vert au rouge) sur notre carte. En effet, en utilisant différentes teintes pour représenter ces mesures, l'utilisateur va pouvoir facilement et simplement analyser les variations de la qualité de l'air à Grenoble.
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><h4>Interactions Carte</h4></li>
          </ul>
          <p>Nous avons intégré plusieurs types d'interactions sur notre carte. L'utilisateur peut activer ou désactiver différentes couches, zoomer sur une zone en particulier et accéder à des info-bulles en cliquant sur les éléments. Pour obtenir davantage d'informations, il peut également ouvrir un onglet dédié qui détaille les données et donne accès à d'autres graphiques.</p>
          <p>Ces interactions nous permettent d'avoir une carte plus lisible, informative, et adaptée à des utilisateurs différents.</p>
          <h3 style="margin-top: 1rem; margin-bottom: 0.5rem;">3. Choix des diagrammes :</h3>
          <p>Les diagrammes permettent quant à eux d'analyser le "combien", "comment" et "pourquoi", qui ne peuvent pas être représentés sur la carte et permettent des comparaisons ou encore des corrélations.</p>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><h4>Histogramme</h4></li>
          </ul>
          <p>Nous avons utilisé des histogrammes pour comparer les différentes lignes de transport, des pistes cyclables ou encore la qualité de l'air. Les histogrammes sont les diagrammes les plus efficaces pour comparer visuellement différentes valeurs.</p>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><h4>Graphiques linéaires</h4></li>
          </ul>
          <p>Les graphiques linéaires vont nous permettre de suivre l'évolution du flux à vélo, ou encore de la qualité de l'air. Ces graphiques sont les plus adaptés pour des données chronologiques et suivre les tendances au fil du temps.</p>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><h4>Diagramme en étoile</h4></li>
          </ul>
          <p>Filtrable par quartiers de Grenoble, ce diagramme permet de comparer les quartiers de Grenoble sur plusieurs dimensions (nombres d'arceaux/pistes cyclables, places de parkings, qualité de l'air, ...). Il permet d'identifier visuellement et rapidement les quartiers “bons élèves” en mobilité douce.</p>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><h4>Diagramme de Sankey</h4></li>
          </ul>
          <p>Ce diagramme nous permet de représenter les flux entre différentes catégories, ce qui est utile pour visualiser les relations et les transferts entre ces catégories (contrairement à un histogramme ou un graphique). Grâce à ce diagramme, l'utilisateur peut comprendre comment les flux de mobilité se répartissent entre différentes zones ou modes de transport.<p/>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><h4>Calendrier Heatmap</h4></li>
          </ul>
          <p>Nous avons utilisé ce diagramme pour représenter la qualité de l'air. Ce type de visualisation est adapté pour repérer rapidement les tendances temporelles, comme par exemple les pics de pollution en hiver qu'on peut observer sur plusieurs années.</p>
          </div>
      </div>       

      <!-- Pour aller plus loin ... -->
      <div class="span-12 card">
        <h2>Pour aller plus loin ...</h2>
        <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">
          <h3 style="margin-top: 0; margin-bottom: 0.5rem;">1. </h3>
          <p></p>
        </div>
      </div>

      <!-- URL données -->
      <div class="span-12 card">
        <h2>Sources des Données Utilisées</h2>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><a href="https://grenoble-backoffice.data4citizen.com/dataset/lignes-de-transport-du-reseau-tag" target="_blank" rel="noopener">Lignes tram/bus</a></li>
            <li><a href="https://grenoble-backoffice.data4citizen.com/dataset/pcm" target="_blank" rel="noopener">Pistes cyclables</a></li>
            <li><a href="https://grenoble-backoffice.data4citizen.com/dataset/bornes-de-recharge-pour-vehicules-electriques" target="_blank" rel="noopener">Bornes recharge VE</a></li>
            <li><a href="https://grenoble-backoffice.data4citizen.com/dataset/emplacements-cite-lib" target="_blank" rel="noopener">Parkings voiture auto-partage (Citiz)</a></li>
            <li><a href="https://backend.citiz.fr/public/provider/5/gbfs/v3.0/vehicle_status.json" target="_blank" rel="noopener">Disponibilité voiture auto-partage</a></li>
            <li><a href="https://grenoble-backoffice.data4citizen.com/dataset/parkings" target="_blank" rel="noopener">Parkings vélo/trotinette électrique</a></li>
            <li><a href="https://grenoble-backoffice.data4citizen.com/dataset/trottinettes-en-libre-service" target="_blank" rel="noopener">Disponibilité trottinettes</a></li>
            <li><a href="https://grenoble-backoffice.data4citizen.com/dataset/velos-en-libre-service" target="_blank" rel="noopener">Disponibilité vélos</a></li>
            <li><a href="https://grenoble-backoffice.data4citizen.com/dataset/les_arceaux_a_velo_sur_le_territoire_de_grenoble" target="_blank" rel="noopener">Arceaux vélo</a></li>
            <li><a href="https://aqicn.org/" target="_blank" rel="noopener">AQIcn</a></li>
            <li><a href="https://sensor.community/en/" target="_blank" rel="noopener">Qualité de l'air</a></li>
            <li><a href="https://grenoble-backoffice.data4citizen.com/dataset/places-disponibles-en-temps-reel-des-parkings-relais-p-r" target="_blank" rel="noopener">Parkings relais (disponibilités)</a></li>
            <li><a href="https://grenoble-backoffice.data4citizen.com/dataset/resultats_de_l_observatoire_des_comptages_de_mobilite" target="_blank" rel="noopener">Comptages passages voiture/vélo</a></li>
            <li><a href="https://data.metropolegrenoble.fr/visualisation/table/?id=les-unions-de-quartier" target="_blank" rel="noopener">Quartiers de Grenoble</a></li>
            <li><a href="https://data.mobilites-m.fr/" target="_blank" rel="noopener">Lignes de transports</a></li>
            <li><a href="https://react-icons.github.io/react-icons/" target="_blank" rel="noopener">Icones SVG</a></li>
          </ul>
        </div>
      </div>

    </section>
    `;

    return () => {};
  }
};
