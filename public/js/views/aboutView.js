
import { icons } from "../utils/icons.js";

export default {
  title: 'À propos',
  icon: 'info',
  async mount(root) {
    root.innerHTML = `
    <h2 class="title">À propos du Projet</h2>
    
    <section class="grid">
      <!-- Équipe -->
      <div class="span-12 card">
        <h2>Équipe</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1.5rem; margin-top: 1rem;">
          
          <div style="padding: 1rem; background: rgba(79, 124, 255, 0.05); border-radius: 8px; border-left: 3px solid #4f7cff;">
            <h3 style="margin: 0; font-size: 1.1rem;">${icons.person} Yassine OUAHMANE</h3>
          </div>

          <div style="padding: 1rem; background: rgba(41, 193, 140, 0.05); border-radius: 8px; border-left: 3px solid #29c18c;">
            <h3 style="margin: 0; font-size: 1.1rem;">${icons.person} Lisa BANIHACHEMI</h3>
          </div>

          <div style="padding: 1rem; background: rgba(255, 209, 102, 0.05); border-radius: 8px; border-left: 3px solid #ffd166;">
            <h3 style="margin: 0; font-size: 1.1rem;">${icons.person} Felix RUNQUIST</h3>
          </div>

          <div style="padding: 1rem; background: rgba(236, 72, 153, 0.05); border-radius: 8px; border-left: 3px solid #ec4899;">
            <h3 style="margin: 0; font-size: 1.1rem;">${icons.person} Baptiste CONTENT</h3>
          </div>

        </div>
      </div>  
    
    <!-- Description du Projet -->
      <div class="span-12 card">
        <h2>Observatoire Mobilités & Environnement</h2>
        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">
          Un observatoire interactif dédié à l'analyse et la visualisation des données de mobilité 
          et d'environnement sur le territoire de Grenoble-Alpes Métropole.
        </p>
      </div>

      <!-- Idée du Projet -->
      <div class="span-12 card">
        <h2>Idée du Projet</h2>
        <p style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">
          Face aux enjeux croissants de mobilité durable et de qualité environnementale, ce projet vise à 
          <strong>centraliser et visualiser</strong> les données ouvertes relatives aux transports, au stationnement, 
          aux zones à faibles émissions (ZFE) et à la qualité de l'air. L'objectif est de fournir aux citoyens, 
          décideurs et chercheurs une <strong>vue holistique et interactive</strong> des mobilités urbaines et 
          de leurs impacts environnementaux.
        </p>
      </div>

      <!-- Traitement des Données -->
      <div class="span-12 card">
        <h2>Traitement des Données</h2>
        <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">
          <h3 style="margin-top: 0; margin-bottom: 0.5rem;">Sources de données:</h3>
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li><strong>Stationnement:</strong> Données de disponibilité temps réel, capacités, tarification</li>
            <li><strong>Transport public:</strong> Lignes de transport en commun (TAG), itinéraires</li>
            <li><strong>Mobilité douce:</strong> Comptages vélos, pistes cyclables, arceaux</li>
            <li><strong>Véhicules électriques:</strong> Stations de recharge IRVE (Infrastructure de Recharge)</li>
            <li><strong>Zones ZFE:</strong> Périmètres et axes des zones à faibles émissions</li>
            <li><strong>Qualité de l'air:</strong> Données de qualité atmosphérique et pollution</li>
          </ul>
          
          <h3 style="margin-top: 1rem; margin-bottom: 0.5rem;">Pipeline de traitement:</h3>
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

      <!-- Attribution -->
      <div class="span-12 card">
        <h2>Attribution</h2>
        <p>Afin de réaliser ce projet, nous avons utilisé plusieurs sources pour les données.</p>
        <div style="font-size: 0.95rem; line-height: 1.6; color: var(--text-secondary);">
          <ul style="margin: 0.5rem 0; padding-left: 1.5rem;">
            <li>Qualité de l'air: <a href="https://aqicn.org/" target="_blank">AQIcn</a>, <a href="https://sensor.community/en/" target="_blank">sensor.community</a></li>
            <li>Lignes de transport: <a href="https://data.mobilites-m.fr/" target="_blank">data.mobilites-m.fr</a></li>
            <li>Icones SVG: <a href="https://react-icons.github.io/react-icons/" target="_blank">React icons</a></li>
          </ul>
        </div>
      </div>

    </section>
    `;

    return () => {};
  }
};
