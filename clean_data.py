#!/usr/bin/env python3
"""
Script de nettoyage automatisé pour tous les fichiers CSV sous /data
Nettoie les données : colonnes vides, doublons, espaces, encodage, etc.
"""

import os
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime
import json

class DataCleaner:
    def __init__(self, data_dir='./data'):
        self.data_dir = Path(data_dir)
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'files_processed': [],
            'total_files': 0,
            'total_rows_before': 0,
            'total_rows_after': 0,
            'issues_found': []
        }
    
    def find_csv_files(self):
        """Trouve tous les fichiers CSV"""
        csv_files = list(self.data_dir.rglob('*.csv'))
        print(f"Trouvé {len(csv_files)} fichiers CSV")
        return csv_files
    
    def clean_file(self, filepath):
        """Nettoie un fichier CSV spécifique"""
        file_info = {
            'name': filepath.name,
            'path': str(filepath),
            'rows_before': 0,
            'rows_after': 0,
            'actions': []
        }
        
        try:
            # Lire le fichier
            df = pd.read_csv(filepath, encoding='utf-8')
            file_info['rows_before'] = len(df)
            
            # 1. Supprimer les colonnes entièrement vides
            cols_before = len(df.columns)
            df = df.dropna(axis=1, how='all')
            cols_after = len(df.columns)
            if cols_before > cols_after:
                file_info['actions'].append(f"Supprimé {cols_before - cols_after} colonnes vides")
            
            # 2. Nettoyer les noms de colonnes (trim espaces, minuscules)
            df.columns = df.columns.str.strip()
            
            # 3. Nettoyer les espaces dans les cellules texte
            for col in df.select_dtypes(include=['object']).columns:
                df[col] = df[col].str.strip() if df[col].dtype == 'object' else df[col]
            
            # 4. Supprimer les doublons complets
            dupes_before = len(df)
            df = df.drop_duplicates()
            dupes_after = len(df)
            if dupes_before > dupes_after:
                file_info['actions'].append(f"Supprimé {dupes_before - dupes_after} doublons")
            
            # 5. Convertir les colonnes numériques
            for col in df.columns:
                if 'id' in col.lower() or 'code' in col.lower() or any(x in col.lower() for x in ['count', 'nombre', 'total', 'nb_', 'place', 'tmj']):
                    try:
                        df[col] = pd.to_numeric(df[col], errors='coerce')
                    except:
                        pass
            
            # 6. Standardiser les colonnes booléennes
            for col in df.columns:
                if df[col].dtype == 'object':
                    unique_vals = df[col].dropna().unique()
                    if len(unique_vals) <= 3 and all(str(v).lower() in ['0', '1', 'true', 'false', 'yes', 'no', 'oui', 'non'] for v in unique_vals):
                        df[col] = df[col].map(lambda x: 1 if str(x).lower() in ['1', 'true', 'yes', 'oui'] else (0 if str(x).lower() in ['0', 'false', 'no', 'non'] else x))
                        file_info['actions'].append(f"Standardisé colonne booléenne: {col}")
            
            # 7. Vérifier les colonnes avec trop de valeurs manquantes
            for col in df.columns:
                missing_pct = (df[col].isna().sum() / len(df)) * 100
                if missing_pct > 50:
                    file_info['actions'].append(f"Colonne '{col}' a {missing_pct:.1f}% valeurs manquantes")
            
            file_info['rows_after'] = len(df)
            
            # Sauvegarder le fichier nettoyé
            df.to_csv(filepath, index=False, encoding='utf-8')
            file_info['status'] = 'SUCCESS'
            
            print(f" {filepath.name}: {file_info['rows_before']} → {file_info['rows_after']} lignes")
            
        except Exception as e:
            file_info['status'] = 'ERROR'
            file_info['error'] = str(e)
            print(f"{filepath.name}: {e}")
        
        return file_info
    
    def clean_all(self):
        """Nettoie tous les fichiers CSV"""
        csv_files = self.find_csv_files()
        self.results['total_files'] = len(csv_files)
        
        print("\n🧹 Nettoyage en cours...\n")
        
        for filepath in sorted(csv_files):
            file_info = self.clean_file(filepath)
            self.results['files_processed'].append(file_info)
            self.results['total_rows_before'] += file_info.get('rows_before', 0)
            self.results['total_rows_after'] += file_info.get('rows_after', 0)
        
        self.generate_report()
    
    def generate_report(self):
        """Génère un rapport de nettoyage"""
        report_path = Path('./DATA_CLEANING_REPORT.json')
        
        rows_removed = self.results['total_rows_before'] - self.results['total_rows_after']
        success_count = sum(1 for f in self.results['files_processed'] if f.get('status') == 'SUCCESS')
        
        print("\n" + "="*60)
        print("RAPPORT DE NETTOYAGE DES DONNÉES")
        print("="*60)
        print(f" Fichiers traités: {success_count}/{self.results['total_files']}")
        print(f" Lignes avant: {self.results['total_rows_before']}")
        print(f" Lignes après: {self.results['total_rows_after']}")
        print(f" Lignes supprimées: {rows_removed}")
        print(f" Timestamp: {self.results['timestamp']}")
        print("="*60)
        
        # Détails par fichier
        print("\nDÉTAILS PAR FICHIER:\n")
        for file_info in self.results['files_processed']:
            status = "Succès" if file_info.get('status') == 'SUCCESS' else "Erreur"
            print(f"{status} {file_info['name']}")
            if file_info.get('rows_before'):
                print(f"   Lignes: {file_info['rows_before']} → {file_info['rows_after']}")
            if file_info.get('actions'):
                for action in file_info['actions']:
                    print(f"   • {action}")
            print()
        
        # Sauvegarder le rapport JSON
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        print(f"\n Rapport sauvegardé: {report_path}")

if __name__ == '__main__':
    cleaner = DataCleaner('./data')
    cleaner.clean_all()
