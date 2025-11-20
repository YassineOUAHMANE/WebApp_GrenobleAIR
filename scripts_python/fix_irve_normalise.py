#!/usr/bin/env python3
"""
Nettoyage spécifique pour irve_normalise_etalab.csv
Problème: Colonne cable_t2_attache a des valeurs mixtes (TRUE/false/0/1/vide)
Solution: Standardiser les valeurs booléennes avant nettoyage pandas
"""

import pandas as pd
import re
from pathlib import Path

def fix_irve_normalise():
    filepath = Path('/home/yassine/Desktop/ChallengeOpenData/open-data/data/irve/irve_normalise_etalab.csv')
    
    print(f" Nettoyage spécifique de {filepath.name}...")
    
    try:
        # Lire le fichier avec gestion des encodages
        df = pd.read_csv(filepath, encoding='utf-8')
        
        print(f"Fichier chargé: {len(df)} lignes, {len(df.columns)} colonnes")
        
        # ===== NETTOYAGE =====
        
        # 1. Supprimer colonnes entièrement vides
        empty_cols = [col for col in df.columns if df[col].isna().all()]
        if empty_cols:
            print(f"   🗑️  Suppression de {len(empty_cols)} colonnes vides: {empty_cols}")
            df = df.drop(columns=empty_cols)
        
        # 2. Nettoyer les noms de colonnes (trim, lowercase)
        df.columns = [col.strip().lower() for col in df.columns]
        
        # 3. Supprimer les doublons exacts
        before_dedup = len(df)
        df = df.drop_duplicates()
        removed_dupes = before_dedup - len(df)
        if removed_dupes > 0:
            print(f"{removed_dupes} doublons supprimés")
        
        # 4. Nettoyer les valeurs texte (trim whitespace)
        text_cols = df.select_dtypes(include=['object']).columns
        for col in text_cols:
            df[col] = df[col].apply(lambda x: str(x).strip() if pd.notna(x) and isinstance(x, str) else x)
        
        # 5. Convertir colonnes numériques
        numeric_patterns = ['id', 'count', 'nb_', 'nbre', 'nombre', 'puissance', 'tmja']
        for col in df.columns:
            if any(pattern in col.lower() for pattern in numeric_patterns):
                try:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                except:
                    pass
        
        # 6. Standardiser colonnes booléennes
        bool_patterns = ['prise_type_', 'gratuit', 'paiement_', 'reservation', 'accessibilite', 'restriction', 'cable_t2']
        for col in df.columns:
            if any(pattern in col.lower() for pattern in bool_patterns):
                try:
                    # Convertir les valeurs mixtes en booléen
                    df[col] = df[col].apply(lambda x: _normalize_bool(x))
                except Exception as e:
                    print(f"Erreur lors de la conversion de {col}: {e}")
        
        # 7. Signaler colonnes avec >50% valeurs manquantes
        sparse_cols = {}
        for col in df.columns:
            missing_pct = (df[col].isna().sum() / len(df)) * 100
            if missing_pct > 50:
                sparse_cols[col] = missing_pct
        
        if sparse_cols:
            print(f"Colonnes avec >50% valeurs manquantes:")
            for col, pct in sorted(sparse_cols.items(), key=lambda x: x[1], reverse=True)[:5]:
                print(f"       • {col}: {pct:.1f}%")
        
        # Sauvegarder
        df.to_csv(filepath, index=False)
        print(f"{filepath.name}: {len(df)} lignes sauvegardées")
        return True
        
    except Exception as e:
        print(f"Erreur lors du nettoyage: {e}")
        import traceback
        traceback.print_exc()
        return False


def _normalize_bool(value):
    """Convertir valeurs mixtes en booléen"""
    if pd.isna(value):
        return pd.NA
    
    val_str = str(value).strip().lower()
    
    # Valeurs vraies
    if val_str in ['true', '1', 'yes', 'oui', 'vrai']:
        return 1
    # Valeurs fausses
    elif val_str in ['false', '0', 'no', 'non', 'faux', '']:
        return 0
    # Conserver la valeur d'origine si indéterminée
    else:
        return pd.NA


if __name__ == '__main__':
    fix_irve_normalise()
