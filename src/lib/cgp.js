import cgpData from '../data/cgp.json'

// Table des 75 correspondances graphème-phonème, extraite de la thèse de
// Jérôme Riou (2017, créateur d'Anagraph, anagraph.ens-lyon.fr), triée par
// fréquence théorique décroissante. Voir docs/superpowers/specs pour la
// source complète et les vérifications RISS.

export function toutesLesCorrespondances() {
  return cgpData
}

export function correspondanceParRang(rang) {
  return cgpData.find(c => c.rang === rang) ?? null
}

// Un même graphème écrit (ex. "t") peut apparaître sur plusieurs lignes avec
// des codes phonétiques différents (t→[t] rang 5, t muet rang 22, t→[s] rang
// 41 comme dans "nation") — c'est le couple (graphème, code) qui identifie la
// correspondance exacte utilisée dans un mot donné, pas le graphème seul.
export function correspondanceParGraphemeEtCode(grapheme, code) {
  return cgpData.find(c => c.variantes.includes(grapheme) && c.code === code) ?? null
}
