import manulemmeData from '../data/manulemme.json'

// Lexique ManuLemme (16 008 lemmes), avec pour chaque mot sa segmentation
// grapho-phonémique déjà calculée par ses auteurs — utilisé comme source de
// vérité plutôt qu'un algorithme de segmentation maison.
export function chercherMot(motNettoye) {
  return manulemmeData[motNettoye] ?? null
}
