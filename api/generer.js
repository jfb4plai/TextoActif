import { requireUser } from './_auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' })
  }

  const user = await requireUser(req, res)
  if (!user) return

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API manquante (ANTHROPIC_API_KEY)' })
  }

  const {
    sujet, contexte = '', longueurMots, correspondances,
    motsConnus = [], varianteFrancais = 'belgique', renforcer = false, allegerVersHautDeGamme = false,
  } = req.body

  if (!sujet || !longueurMots || !Array.isArray(correspondances) || correspondances.length === 0) {
    return res.status(400).json({ error: 'sujet, longueurMots et correspondances sont requis' })
  }

  const graphemesTexte = correspondances.join(', ')
  const motsTexte = motsConnus.length > 0 ? motsConnus.join(', ') : '(aucun)'

  const consigneVocabulaire = varianteFrancais === 'france'
    ? "Utilise le vocabulaire du français de France (ex. : quatre-vingt-dix, soixante-dix, petit-déjeuner/déjeuner/dîner pour les repas du matin/midi/soir, goûter)."
    : "Utilise le vocabulaire du français de Belgique, jamais des termes typiquement franco-français (ex. : nonante, septante, déjeuner/dîner/souper pour les repas du matin/midi/soir, collation ou dix-heures plutôt que goûter, essuie plutôt que serviette)."

  const systemPrompt = `Tu écris un texte court pour un·e élève de primaire (P1-P3) en difficulté de lecture, sur le sujet donné par l'enseignant.

RÈGLES D'ÉCRITURE ABSOLUES :
- Tu écris directement le texte, sans introduction ni commentaire autour.
- Jamais "Voici", "Bien sûr", ou toute formule de transition.
- Vise environ ${longueurMots} mots.
- ${consigneVocabulaire}
${contexte ? `- Contexte temporel/pédagogique de la classe : ${contexte}. Calibre la complexité et le vocabulaire attendus en fonction de ce moment de l'année (un P1 de septembre n'a pas le niveau réel d'un P1 de juin), et ancre le texte dans ce que l'élève vit à ce moment.` : ''}
- Privilégie des mots composés des sons suivants, déjà enseignés : ${graphemesTexte}.
- Tu peux aussi utiliser les mots suivants, déjà mémorisés par la classe : ${motsTexte}.
- Le texte doit rester compréhensible et naturel, jamais une suite de syllabes sans lien.
${renforcer ? "- L'essai précédent contenait trop de mots hors de ces sons ou de cette liste : simplifie encore le vocabulaire pour ce nouvel essai." : ''}
${allegerVersHautDeGamme ? "- L'essai précédent était plus facile que nécessaire : utilise un peu plus de vocabulaire varié, hors de la liste stricte, pour enrichir le texte." : ''}
- N'ajoute aucune note, aucune explication après le texte.`

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        temperature: renforcer ? 0.3 : 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: sujet }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      if (response.status === 529 || err.error?.type === 'overloaded_error') {
        return res.status(503).json({ error: 'API surchargée — réessayez dans quelques secondes.' })
      }
      return res.status(500).json({ error: err.error?.message ?? 'Erreur API Anthropic' })
    }

    const data = await response.json()
    const texte = data.content?.[0]?.text ?? ''
    return res.status(200).json({ texte })

  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
