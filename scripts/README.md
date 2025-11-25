# Scripts - Outils d'utilité

Ce dossier contient tous les scripts utilitaires pour gérer et maintenir le projet.

## Démarrage du serveur

```bash
./scripts/start-server.sh
```

Lance le dashboard sur http://localhost:8000 (ou le prochain port disponible).

## Nettoyage et organisation des données

### `organize-data.py`
Réorganise la structure des dossiers de données.

```bash
python3 scripts/organize-data.py
```

### `compress-csv.sh`
Compresse les fichiers CSV en GZIP pour optimiser la bande passante.

```bash
bash scripts/compress-csv.sh
```

### `clean-data.py`
Nettoie et valide les données CSV.

```bash
python3 scripts/clean-data.py
```

### `fix-irve.py`
Corrige les données IRVE (Infrastructure de Recharge pour Véhicules Électriques).

```bash
python3 scripts/fix-irve.py
```

## Configuration du projet

### `setup-project.sh`
Configure l'architecture initiale du projet.

```bash
bash scripts/setup-project.sh
```

---

**Note :** Tous les scripts Python sont optionnels pour utiliser le dashboard. Ils sont utiles pour les contributeurs qui modifient les données.
