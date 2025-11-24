## - Flux voiture/vélo/piétons
Plusieurs points sur la map en fonction du type sélectionné, qui changent de taille en fonction de l'intensité du flux.

## - Attaches vélos
Icone sur la map, cliquable pour avoir le nombre.

## - Parkings trotinettes/vélo/bornes recharge voiture
Icones, pour voir la différence du nombre de ce qui est proposé pour les différentes mobilités.

## - Qualité de l'air
Couleur sur la carte pour voir les zones +/- polluées.

## - Temps
Slide pour voir l'évolution de ces différents critères dans le Temps

--> Ou est-ce qu'on circule le plus et comment, est-ce que la qualité de l'air est bonne ou mauvaise dans ces zones, comment sont équipés les différentes zones de la ville, qu'est-ce qui encourage ou freine les mobilités plus écologiques.

--> destiné aux grenoblois & législateurs (mairie, métro)
--> pour savoir comment ils peuvent se déplacer, impact de leur mode de déplacement (impact qualité de l'air l'hiver)


## Liste visualisation :

- lignes tram/bus : https://grenoble-backoffice.data4citizen.com/dataset/lignes-de-transport-du-reseau-tag
- pistes cyclables : https://grenoble-backoffice.data4citizen.com/dataset/pcm
- bornes recharge voiture électrique : https://grenoble-backoffice.data4citizen.com/dataset/bornes-de-recharge-pour-vehicules-electriques
- parkings voiture auto-partage (citiz) : https://grenoble-backoffice.data4citizen.com/dataset/emplacements-cite-lib
- disponibilité voiture auto-partage : https://backend.citiz.fr/public/provider/5/gbfs/v3.0/vehicle_status.json
- parkings vélo/trotinette électrique : https://grenoble-backoffice.data4citizen.com/dataset/parkings
- disponibilité vélo/trotinette électrique : https://grenoble-backoffice.data4citizen.com/dataset/trottinettes-en-libre-service & https://grenoble-backoffice.data4citizen.com/dataset/velos-en-libre-service
- arceaux vélo : https://grenoble-backoffice.data4citizen.com/dataset/les_arceaux_a_velo_sur_le_territoire_de_grenoble
- qualité de l'air (indice ATMO) : https://aqicn.org/city/france/rhonealpes/isere/grenoble-les-frenes/ & https://www.data.gouv.fr/datasets/indice-atmo ou https://www.atmo-auvergnerhonealpes.fr
- parkings voiture : https://grenoble-backoffice.data4citizen.com/dataset/parkings & https://grenoble-backoffice.data4citizen.com/dataset/disponibilite-temps-des-parkings & https://grenoble-backoffice.data4citizen.com/dataset/places-disponibles-en-temps-reel-des-parkings-relais-p-r
- comptage passages voiture/vélo (flux) : https://grenoble-backoffice.data4citizen.com/dataset/resultats_de_l_observatoire_des_comptages_de_mobilite
- points de location M'velo : https://grenoble-backoffice.data4citizen.com/dataset/points_de_location_m_velo_


# Début rédaction justification

L'objectif de notre projet est de proposer une application interactive, permettant aux Grenoblois, touristes, ainsi qu'aux décideurs locaux (mairie, métropole, ...) de mieux comprendre comment ils peuvent se déplacer à Grenoble, comment sont équipées les différentes zones de la ville, et quels impacts les différentes mobilitées peuvent avoir.
Pour réaliser notre projet, nous allons donc usiliser une carte avec différents réseaux et des icônes clicables. De plus, nous allons rajouter une temporalitée et laisser la possibilité à l'utilisateur de sélectoinner des mois différents. Nous allons aussi laisser la possibilité à l'utilisateur de selectionner certains types de données par exemple, pour rendre la carte le plus interractive et personnalisée à l'utilisateur.
Voici la justification de nos choix de visualisation :

## 1 - Carte
Les données que nous voulons afficher sont géolocalisées, comme les lignes de transport, les pistes cyclables ou encore les stations M'Velo. Nous avons donc opté pour une carte sur la page principale de notre application.
La position géographique permet une lecture simple et claire pour les différents utilisateurs, en leur apportant directement la vision "où" et l'analyse simple de la structure des mobilitées à Grenoble.
Notre application ayant pour contrainte une taille de 10Mo max imposés, le choix d'utiliser une carte nous a paru le plus juste pour afficher un grand nombre de données sans surcharger la page, tout en conservant une bonne lisibilité de la carte. Les vecteurs permettent un rendu net sur plusieurs niveaux de zooms.

## 2 - Représentation des données sur la carte

#### Données linéaires : bus, tram, pistes cyclables
Pour représenter ces données linéraires de réseaux de transport, nous avons fait le choix d'utiliser un node-link diagram, sous forme de lignes de plusieurs couleurs, avec des lignes de différentes couleurs (en fonction du transport) et différentes épaisseurs (en fonction de la fréquence).
De plus, nous allons laisser la possibilié à l'utilisateur de sélectionner et afficher les différents numéros de lignes.

#### Données ponctuelles : bornes, parkings, stations M'Velo, acreaux, citiz
Les bornes et les différents équipements sont localisés sur des points précis dans Grenoble. Nous allons donc les représenter par des icônes de différentes formes et couleurs. Cela permet à l'utilisateur de notre application une identification simple et quasi-immédiate tout en conservant la lisiblité de la carte.
**à changer/préciser :** La disponibilité des différents véhicule est encodée en fonction de l'intensité ou la transparence de l'icône.
Chaque icône est clicable et permet d'afficher plus de précisions sur ces différents points, comme par exemple la disponibilité des véhicules.

#### Qualité de l'air : indice ATMO
L'indice ATMO est une donnéee quantitative, que l'on va représenter par l'ajout de variation de couleurs (du vert au rouge) sur notre carte. En effet, en utilisant différentes teintes pour représenter ces mesures, l'utilisateur va pouvoir facilement et simplement analyser les variations de la qualité de l'air à Grenoble.

#### Comptage des flux : voiture, vélo
Nous allons utiliser des cercles proportionnels en fonction de l'intensité du traffic de vélos et de voiture.

#### Interactions sur la carte
Nous avons ajouté plusieurs types d'interractions sur notre carte. L'utilisateur peut sélectionner/déselectionner certaines couches, zoomer sur des zones spécifiques, accéder à des infos bulles en clic (pour plus de précisions, il pourra accéder à l'onglet qui détaille les données et lui permet d'accéder à d'autres graphiques).
Ces interactions nous permettent d'avoir une carte plus lisible, informative, et adaptée à des utilisateurs différents.

## 3 - Diagrammes
Les diagrammes permettent quant à eux d'analyser le "combien", "comment" et "pourquoi", qui ne peuvent pas être représentés sur la carte et permettent des comparaisons ou encore des corrélations.

#### Histogrammes
Nous avons utilisé des histogrammes pour comparer l'équipement des quartiers (arceaux, pistes, bornes), les flux moyens et les différents modes de transports.
Les histogrammes sont les diagrammes les plus efficaces pour comparer différentes valeurs.

#### Graphiques linéaires 
Les graphiques linéaires vont nous permettre de suivre l'évolution de la qualité de l'aire, du flux vélo/voiture et d'analyser la disponibilité des vélos et voitures de partage au cours du temps.
Ces graphiques sont les plus adaptés pour des données chronologiques.

####  Nuage de points
Pour observer les corrélations entre nos différentes variables (pollution et flux voiture, usage vélo et équipement de quartier, ...), nous avons utilisés des nuages de points, car on peut observer rapidement la covariance ou encore les valeurs extrêmes.

#### Diagramme en étoile
Nous allons utilisé un diagramme en étoile avec un filtre par quartier pour comparer plusieurs de ses dimensions, comme la pollution, le nombre d'arceaux, ou encore le trafic.
Ce type de diagramme est efficace pour représenter des profils multidimensionnels et permmettent une meilleure analyse?



## - Pistes d'amélioration


