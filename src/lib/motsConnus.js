export function normaliserMotsConnus(mots) {
  const nettoyes = mots.map(m => m.trim()).filter(Boolean)
  const vus = new Set()
  const resultat = []
  for (const mot of nettoyes) {
    const cle = mot.toLowerCase()
    if (vus.has(cle)) continue
    vus.add(cle)
    resultat.push(mot)
  }
  return resultat
}

export function parserMotsConnus(texte) {
  return normaliserMotsConnus(texte.split(/[\n,]+/))
}

// Liste suggérée comme point de départ à l'enseignant (référentiel de
// Français et Langues Anciennes — Tronc commun FWB, p.41, source Giasson
// 2003) — jamais injectée automatiquement dans le calcul, seulement proposée
// en UI pour copie/édition (voir bouton "Copier la liste suggérée").
export const LISTE_HAUTE_FREQUENCE_REFERENCE = [
  'à', 'au', 'aux', 'aller', 'autre', 'avec', 'avoir', 'bien',
  'ce', 'cet', 'cette', 'ces', 'comme', 'de', 'du', 'des', 'dans',
  'dire', 'donner', 'elle', 'elles', 'en', 'et', 'être', 'eux',
  'faire', 'il', 'ils', 'je', 'me', 'moi', 'le', 'la', 'les',
  'leur', 'leurs', 'lui', 'mais', 'mon', 'ma', 'mes', 'ne',
  'notre', 'nos', 'on', 'où', 'ou', 'par', 'pas', 'plus', 'pour',
  'pouvoir', 'prendre', 'que', 'qui', 'se', 'sans', 'savoir',
  'si', 'soi', 'son', 'sa', 'ses', 'sur', 'te', 'tu', 'toi',
  'ton', 'ta', 'tes', 'tout', 'toute', 'tous', 'un', 'une',
  'uns', 'unes', 'venir', 'voir', 'votre', 'vos', 'vouloir',
  'vous', 'y',
]
