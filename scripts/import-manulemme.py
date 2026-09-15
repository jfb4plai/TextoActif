# Génère src/data/manulemme.json à partir de la base lexicale ManuLemme
# (16 008 lemmes, segmentation grapho-phonémique déjà calculée par ses
# auteurs). Source : fichier personnel de l'utilisateur, hors du dépôt.
#
# Colonnes utilisées (0-indexées, feuille "manulemme-ver2.4", données à
# partir de la ligne 4) :
#   0  ortho     — forme écrite du lemme
#   12 Grapheme  — segmentation en graphèmes, points-séparés (ex. ".ch.a.t")
#   13 Phoneme   — segmentation en codes phonétiques alignée 1-pour-1 avec
#                  la colonne Grapheme (ex. ".S.a.#" pour "chat")
#
# Les deux segmentations sont alignées positionnellement : le i-ème graphème
# correspond au i-ème code phonétique. Un mot dont les deux segmentations
# n'ont pas le même nombre d'éléments est ignoré plutôt que d'introduire une
# association graphème-phonème fausse.

import json
import os
import openpyxl

SOURCE = r"C:\Users\jfbeg\OneDrive\enseignement\pôle territorial\outils numériques\apprendre à lire\app pour créer texte à partir phonèmes déterminés\ManuLemme-ver2.4.xlsx"
DEST = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'manulemme.json')

wb = openpyxl.load_workbook(SOURCE, read_only=True, data_only=True)
ws = wb['manulemme-ver2.4']

resultat = {}
ignores = 0
for row in ws.iter_rows(min_row=4, values_only=True):
    ortho = row[0]
    if not ortho:
        continue
    grapheme_seg = row[12]
    phoneme_seg = row[13]
    if not grapheme_seg or not phoneme_seg:
        continue
    graphemes = [g for g in grapheme_seg.split('.') if g]
    codes = [c for c in phoneme_seg.split('.') if c]
    if len(graphemes) != len(codes):
        ignores += 1
        continue
    resultat[ortho] = {"graphemes": graphemes, "codes": codes}

with open(DEST, 'w', encoding='utf-8') as f:
    json.dump(resultat, f, ensure_ascii=False, separators=(',', ':'))

print(f"{len(resultat)} mots exportes vers {DEST} ({ignores} ignores pour segmentation incoherente)")
