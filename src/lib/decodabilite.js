import { toutesLesCorrespondances, correspondanceParGraphemeEtCode } from './cgp'
import { chercherMot } from './manulemme'
import { formesCandidates } from './normalisationMorphologique'

// Ne PAS retirer les accents : les clés ManuLemme et les graphèmes de cgp.json
// les conservent ("école", "é (rang 8)"...) — les stripper rendrait 28% des
// entrées ManuLemme introuvables et ferait retomber ces mots courants dans le
// mode approximatif, le moins fiable.
function nettoyerMot(mot) {
  return mot
    .toLowerCase()
    .replace(/[^a-zàâçèéêëîïôùûü]/g, '')
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

// Élisions ("l'école", "c'est", "j'apprends"...) : l'apostrophe relie une
// forme pleine tronquée (le/la, ce, je, de, me, ne, se, te, que) au mot
// suivant. Sans les séparer, le mot fusionné ("lecole", "cest") n'existe dans
// aucune base et retombe en segmentation approximative, alors que les deux
// parties séparées sont réellement connues. Le graphème/code attribué à la
// partie élidée est lu depuis ManuLemme lui-même (première lettre de la
// forme pleine correspondante), pas inventé à la main.
const FORME_PLEINE_ELISION = { l: 'le', c: 'ce', j: 'je', d: 'de', m: 'me', n: 'ne', s: 'se', t: 'te', qu: 'que' }

function detecterElision(motBrut) {
  const match = motBrut.toLowerCase().match(/^(qu|[lcjdmnst])['’]/)
  if (!match) return null
  const formePleine = chercherMot(FORME_PLEINE_ELISION[match[1]])
  if (!formePleine) return null
  return {
    grapheme: formePleine.graphemes[0],
    code: formePleine.codes[0],
    reste: motBrut.slice(match[0].length),
  }
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

    let motPartiellementInconnu = false

    // Partie élidée éventuelle ("l'", "c'"...), comptée séparément du reste du mot.
    const elision = detecterElision(motBrut)
    const resteApresElision = elision ? nettoyerMot(elision.reste) : null
    const aUneElisionExploitable = Boolean(elision && resteApresElision)

    if (aUneElisionExploitable) {
      totalGraphemes += 1
      const correspondance = correspondanceParGraphemeEtCode(elision.grapheme, elision.code)
      if (correspondance && rangsConnus.includes(correspondance.rang)) {
        graphemesConnus += 1
      } else {
        motPartiellementInconnu = true
      }
    }

    const netAEvaluer = aUneElisionExploitable ? resteApresElision : motNettoye

    let entree = chercherMot(netAEvaluer)
    if (entree) {
      couverture.manulemme++
    } else {
      const candidat = formesCandidates(netAEvaluer).find(c => c !== netAEvaluer && chercherMot(c))
      if (candidat) {
        entree = chercherMot(candidat)
        couverture.normalise++
      }
    }

    if (entree) {
      totalGraphemes += entree.graphemes.length
      entree.graphemes.forEach((grapheme, i) => {
        const correspondance = correspondanceParGraphemeEtCode(grapheme, entree.codes[i])
        if (correspondance && rangsConnus.includes(correspondance.rang)) {
          graphemesConnus++
        } else {
          motPartiellementInconnu = true
        }
      })
    } else {
      couverture.approx++
      const graphemesApprox = segmenterApprox(netAEvaluer)
      totalGraphemes += graphemesApprox.length
      for (const grapheme of graphemesApprox) {
        const connuQuelQueSoitLeCode = toutesLesCorrespondances()
          .some(c => c.variantes.includes(grapheme) && rangsConnus.includes(c.rang))
        if (connuQuelQueSoitLeCode) graphemesConnus++
        else motPartiellementInconnu = true
      }
    }

    if (motPartiellementInconnu) motsNonConformes.push(motBrut)
  }

  if (totalGraphemes === 0) return null

  return {
    pourcentage: Math.round((graphemesConnus / totalGraphemes) * 100),
    couverture,
    motsNonConformes,
  }
}
