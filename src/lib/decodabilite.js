import { toutesLesCorrespondances, correspondanceParGraphemeEtCode } from './cgp'
import { chercherMot } from './manulemme'
import { formesCandidates } from './normalisationMorphologique'

function nettoyerMot(mot) {
  return mot
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
}

function motEstDansLaListe(mot, motsConnus) {
  const nettoye = nettoyerMot(mot)
  return motsConnus.some(m => nettoyerMot(m) === nettoye)
}

let tousLesVariantesCache = null
function tousLesVariantes() {
  if (!tousLesVariantesCache) {
    tousLesVariantesCache = [...new Set(toutesLesCorrespondances().flatMap(c => c.variantes))]
      .sort((a, b) => b.length - a.length)
  }
  return tousLesVariantesCache
}

// Segmentation de secours quand ManuLemme n'a pas le mot : découpage glouton
// par le plus long graphème connu qui préfixe ce qu'il reste, sans
// désambiguïsation phonémique (une lettre isolée est utilisée si aucun
// graphème répertorié ne correspond, pour ne jamais bloquer le comptage).
export function segmenterApprox(motNettoye) {
  const tokens = tousLesVariantes()
  const graphemes = []
  let reste = motNettoye
  while (reste.length > 0) {
    const token = tokens.find(t => reste.startsWith(t))
    if (token) {
      graphemes.push(token)
      reste = reste.slice(token.length)
    } else {
      graphemes.push(reste[0])
      reste = reste.slice(1)
    }
  }
  return graphemes
}

export function partDechiffrable(texte, rangsConnus, motsConnus = []) {
  const mots = texte.trim().split(/\s+/).filter(Boolean)
  if (mots.length === 0) return null

  let totalGraphemes = 0
  let graphemesConnus = 0
  const couverture = { manulemme: 0, normalise: 0, approx: 0 }
  const motsNonConformes = []

  for (const motBrut of mots) {
    const motNettoye = nettoyerMot(motBrut)
    if (!motNettoye) continue

    if (motEstDansLaListe(motBrut, motsConnus)) {
      const entree = chercherMot(motNettoye)
      const nbGraphemes = entree ? entree.graphemes.length : segmenterApprox(motNettoye).length
      totalGraphemes += nbGraphemes
      graphemesConnus += nbGraphemes
      continue
    }

    let entree = chercherMot(motNettoye)
    if (entree) {
      couverture.manulemme++
    } else {
      const candidat = formesCandidates(motNettoye).find(c => c !== motNettoye && chercherMot(c))
      if (candidat) {
        entree = chercherMot(candidat)
        couverture.normalise++
      }
    }

    if (entree) {
      totalGraphemes += entree.graphemes.length
      let motPartiellementInconnu = false
      entree.graphemes.forEach((grapheme, i) => {
        const correspondance = correspondanceParGraphemeEtCode(grapheme, entree.codes[i])
        if (correspondance && rangsConnus.includes(correspondance.rang)) {
          graphemesConnus++
        } else {
          motPartiellementInconnu = true
        }
      })
      if (motPartiellementInconnu) motsNonConformes.push(motBrut)
    } else {
      couverture.approx++
      const graphemesApprox = segmenterApprox(motNettoye)
      totalGraphemes += graphemesApprox.length
      let motPartiellementInconnu = false
      for (const grapheme of graphemesApprox) {
        const connuQuelQueSoitLeCode = toutesLesCorrespondances()
          .some(c => c.variantes.includes(grapheme) && rangsConnus.includes(c.rang))
        if (connuQuelQueSoitLeCode) graphemesConnus++
        else motPartiellementInconnu = true
      }
      if (motPartiellementInconnu) motsNonConformes.push(motBrut)
    }
  }

  if (totalGraphemes === 0) return null

  return {
    pourcentage: Math.round((graphemesConnus / totalGraphemes) * 100),
    couverture,
    motsNonConformes,
  }
}
