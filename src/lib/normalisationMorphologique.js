// Réduction morphologique légère pour retrouver une entrée ManuLemme (base de
// lemmes) à partir d'une forme fléchie simple non couverte telle quelle. Ne
// couvre que le pluriel (-s, -x) et le féminin en -e des adjectifs/noms les
// plus courants en texte P1-P3 — pas la conjugaison, qui demande d'ajouter
// des lettres (mange → manger) plutôt que d'en retirer.
const SUFFIXES_A_RETIRER = ['s', 'x', 'e']

export function formesCandidates(mot) {
  const candidats = [mot]
  for (const suffixe of SUFFIXES_A_RETIRER) {
    if (mot.endsWith(suffixe) && mot.length > suffixe.length + 1) {
      candidats.push(mot.slice(0, -suffixe.length))
    }
  }
  return candidats
}
