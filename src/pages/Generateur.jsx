import { useEffect, useState } from 'react'
import { apiFetch } from '../lib/apiFetch'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { toutesLesCorrespondances, correspondanceParRang } from '../lib/cgp'
import { partDechiffrable } from '../lib/decodabilite'
import { normaliserMotsConnus, parserMotsConnus, LISTE_HAUTE_FREQUENCE_REFERENCE } from '../lib/motsConnus'

const SEUIL = 57
const MAX_TENTATIVES = 3
const SEUIL_PROPOSER_AJUSTEMENT = 75
const NIVEAUX = ['P1', 'P2', 'P3']
const VARIANTES_FRANCAIS = [
  { valeur: 'belgique', label: 'Français de Belgique (FWB)' },
  { valeur: 'france', label: 'Français de France' },
]
const LONGUEURS = [
  { valeur: 30, label: 'Court (~30 mots)' },
  { valeur: 60, label: 'Moyen (~60 mots)' },
  { valeur: 100, label: 'Long (~100 mots)' },
]

function deriverTitre(texte) {
  const premiereLigne = texte.trim().split(/[.!?\n]/)[0].trim()
  const base = premiereLigne || texte.trim()
  return base.length > 60 ? `${base.slice(0, 60)}…` : base
}

export default function Generateur() {
  const { user } = useAuth()

  const [niveauCible, setNiveauCible] = useState('P1')
  const [varianteFrancais, setVarianteFrancais] = useState('belgique')
  const [sujet, setSujet] = useState('')
  const [contexte, setContexte] = useState('')
  const [longueurMots, setLongueurMots] = useState(30)

  const [rangsConnus, setRangsConnus] = useState([])
  const [chargementCorrespondances, setChargementCorrespondances] = useState(true)
  const [enregistrementCorrespondances, setEnregistrementCorrespondances] = useState(false)
  const [correspondancesEnregistrees, setCorrespondancesEnregistrees] = useState(false)

  const [motsConnusTexte, setMotsConnusTexte] = useState('')
  const [dernierMotsEnregistres, setDernierMotsEnregistres] = useState('')
  const [chargementMots, setChargementMots] = useState(true)
  const [enregistrementMots, setEnregistrementMots] = useState(false)
  const [motsEnregistres, setMotsEnregistres] = useState(false)

  const [essais, setEssais] = useState([])
  const [texteGenere, setTexteGenere] = useState('')
  const [scoreObtenu, setScoreObtenu] = useState(null)
  const [couvertureObtenue, setCouvertureObtenue] = useState(null)
  const [motsNonConformesObtenus, setMotsNonConformesObtenus] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function charger() {
      const [{ data: correspondancesData }, { data: motsData }] = await Promise.all([
        supabase.from('texto_correspondances_connues').select('rangs').eq('user_id', user.id).maybeSingle(),
        supabase.from('texto_mots_connus').select('mots').eq('user_id', user.id).maybeSingle(),
      ])
      if (correspondancesData?.rangs) setRangsConnus(correspondancesData.rangs)
      if (motsData?.mots) {
        const texteInitial = motsData.mots.join('\n')
        setMotsConnusTexte(texteInitial)
        setDernierMotsEnregistres(texteInitial)
      }
      setChargementCorrespondances(false)
      setChargementMots(false)
    }
    charger()
  }, [user.id])

  function basculerCorrespondance(rang) {
    setRangsConnus(precedent =>
      precedent.includes(rang) ? precedent.filter(r => r !== rang) : [...precedent, rang]
    )
    setCorrespondancesEnregistrees(false)
  }

  async function enregistrerCorrespondances() {
    setEnregistrementCorrespondances(true)
    setCorrespondancesEnregistrees(false)
    const { error: err } = await supabase
      .from('texto_correspondances_connues')
      .upsert({ user_id: user.id, rangs: rangsConnus, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    setEnregistrementCorrespondances(false)
    if (err) { setError(err.message); return }
    setCorrespondancesEnregistrees(true)
  }

  async function enregistrerMotsConnus() {
    setEnregistrementMots(true)
    setMotsEnregistres(false)
    const mots = parserMotsConnus(motsConnusTexte)
    const { error: err } = await supabase
      .from('texto_mots_connus')
      .upsert({ user_id: user.id, mots, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
    setEnregistrementMots(false)
    if (err) { setError(err.message); return }
    const texteEnregistre = mots.join('\n')
    setMotsConnusTexte(texteEnregistre)
    setDernierMotsEnregistres(texteEnregistre)
    setMotsEnregistres(true)
  }

  function copierListeSuggeree() {
    const fusion = normaliserMotsConnus([...parserMotsConnus(motsConnusTexte), ...LISTE_HAUTE_FREQUENCE_REFERENCE])
    setMotsConnusTexte(fusion.join('\n'))
    setMotsEnregistres(false)
  }

  function appliquerEssai(essai) {
    setTexteGenere(essai.texte)
    setScoreObtenu(essai.score)
    setCouvertureObtenue(essai.resultat?.couverture ?? null)
    setMotsNonConformesObtenus(essai.resultat?.motsNonConformes ?? [])
  }

  function correspondancesActives() {
    return rangsConnus.map(rang => correspondanceParRang(rang)).filter(Boolean).flatMap(c => c.variantes)
  }

  async function genererTexte() {
    setLoading(true)
    setError('')
    setEssais([])
    setSaved(false)

    const correspondances = correspondancesActives()
    const motsConnus = parserMotsConnus(motsConnusTexte)
    let meilleur = null

    try {
      for (let tentative = 1; tentative <= MAX_TENTATIVES; tentative++) {
        const response = await apiFetch('/api/generer', {
          sujet, contexte, longueurMots, correspondances, motsConnus, varianteFrancais, renforcer: tentative > 1,
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Erreur inattendue')

        const resultat = partDechiffrable(data.texte, rangsConnus, motsConnus)
        const score = resultat?.pourcentage ?? 0
        const essai = { tentative, texte: data.texte, score, resultat }
        setEssais(precedents => [...precedents, essai])
        if (!meilleur || Math.abs(score - SEUIL) < Math.abs(meilleur.score - SEUIL)) meilleur = essai
        if (score >= SEUIL) break
      }
      appliquerEssai(meilleur)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function ajusterVersHaut() {
    setLoading(true)
    setError('')
    const correspondances = correspondancesActives()
    const motsConnus = parserMotsConnus(motsConnusTexte)
    try {
      const response = await apiFetch('/api/generer', {
        sujet, contexte, longueurMots, correspondances, motsConnus, varianteFrancais, allegerVersHautDeGamme: true,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Erreur inattendue')
      const resultat = partDechiffrable(data.texte, rangsConnus, motsConnus)
      const score = resultat?.pourcentage ?? 0
      const essai = { tentative: essais.length + 1, texte: data.texte, score, resultat }
      setEssais(precedents => [...precedents, essai])
      appliquerEssai(essai)
    } catch (err) {
      setError(err.message)
    }
    setLoading(false)
  }

  async function enregistrer() {
    if (saving || saved) return
    setSaving(true)
    setError('')

    const { error: err } = await supabase
      .from('texto_textes')
      .insert({
        user_id: user.id,
        titre: deriverTitre(texteGenere),
        texte: texteGenere,
        sujet,
        contexte: contexte || null,
        niveau_cible: niveauCible,
        correspondances_connues: rangsConnus,
        score_dechiffrable: scoreObtenu,
      })

    setSaving(false)
    if (err) { setError(err.message); return }
    setSaved(true)
  }

  return (
    <div className="plai-section">
      <h2>Générer un texte adapté</h2>

      <div role="status" aria-live="polite">
        {error && <div className="plai-error">{error}</div>}
        {saved && <div className="plai-success">Enregistré dans votre historique.</div>}
      </div>

      <div className="plai-field">
        <label className="plai-label" htmlFor="niveau-cible">Niveau cible</label>
        <select
          id="niveau-cible" name="niveau-cible"
          className="plai-input" value={niveauCible} onChange={e => setNiveauCible(e.target.value)}
        >
          {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
          Selon le référentiel FWB, l'apprentissage actif du code se concentre en P1 (« apprenti
          lecteur ») et P2 (« lecteur débutant »). En P3 (« lecteur en transition »), le code est en
          principe déjà maîtrisé et l'accent porte sur la fluence — cette app y reste utile pour la
          différenciation, mais ne remplace pas un travail de fluence pour des élèves déjà à niveau.
        </p>
      </div>

      <div className="plai-field">
        <label className="plai-label" htmlFor="variante-francais">Variante de français</label>
        <select
          id="variante-francais" name="variante-francais"
          className="plai-input" value={varianteFrancais} onChange={e => setVarianteFrancais(e.target.value)}
        >
          {VARIANTES_FRANCAIS.map(v => <option key={v.valeur} value={v.valeur}>{v.label}</option>)}
        </select>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
          Détermine le vocabulaire employé par l'IA (nombres, repas, matériel scolaire...). Par
          défaut sur le français de Belgique pour coller au vécu des élèves FWB (nonante, septante,
          déjeuner/dîner/souper, collation...) — bascule sur le français de France si vous utilisez
          l'app hors FWB.
        </p>
      </div>

      <div className="plai-field">
        <label className="plai-label">Correspondances graphème-phonème déjà enseignées</label>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px', marginBottom: '0.5rem' }}>
          Cochez les correspondances explicitement étudiées en classe, triées par fréquence d'usage
          en français. Cette liste se complète au fil de l'année, séquence après séquence — rien
          n'est coché par défaut, seule votre sélection réelle compte pour le calcul.
        </p>
        <div style={{ maxHeight: '260px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.5rem' }}>
          {toutesLesCorrespondances().map(c => (
            <label key={c.rang} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '14px', padding: '2px 0' }}>
              <input
                type="checkbox"
                checked={rangsConnus.includes(c.rang)}
                onChange={() => basculerCorrespondance(c.rang)}
                disabled={chargementCorrespondances}
              />
              {c.variantes.join(' / ')} — {c.ipa === '#' ? 'muet' : c.ipa ?? '?'}
            </label>
          ))}
        </div>
        <button
          className="plai-btn-ghost" style={{ marginTop: '0.5rem' }}
          onClick={enregistrerCorrespondances} disabled={enregistrementCorrespondances || chargementCorrespondances}
        >
          {enregistrementCorrespondances ? 'Enregistrement…' : correspondancesEnregistrees ? 'Liste enregistrée' : 'Enregistrer ces correspondances'}
        </button>
      </div>

      <div className="plai-field">
        <label className="plai-label" htmlFor="mots-connus">Mots connus de la classe</label>
        <textarea
          id="mots-connus" name="mots-connus"
          className="plai-input" rows={6}
          value={motsConnusTexte}
          onChange={e => { setMotsConnusTexte(e.target.value); setMotsEnregistres(false) }}
          placeholder={'Ex. :\nmonsieur\nmadame\nlundi\nmardi'}
          disabled={chargementMots}
        />
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
          Un mot par ligne (ou séparés par des virgules) : mots-outils, mots fréquents, prénoms de
          classe, vocabulaire spécifique — tout mot que vos élèves reconnaissent globalement, sans
          avoir à le décoder. Liste exhaustive et évolutive : à compléter vous-même après chaque
          nouvelle séquence, ce n'est ni une liste officielle ni un catalogue à cocher.
        </p>
        {!chargementMots && motsConnusTexte !== dernierMotsEnregistres && (
          <p role="status" style={{
            fontSize: '13px', color: '#9a5b0a', background: '#fef3e2', border: '1px solid #f97316',
            borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.75rem', marginTop: '0.5rem',
          }}>
            Modifications non enregistrées — cliquez sur « Enregistrer cette liste » ci-dessous.
            Tant que ce n'est pas fait, ces mots ne comptent pas encore pour le calcul de décodabilité
            et seront perdus si vous quittez la page ou vous déconnectez.
          </p>
        )}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', alignItems: 'center' }}>
          <button className="plai-btn-ghost" onClick={copierListeSuggeree} disabled={chargementMots}>
            Copier la liste suggérée (référentiel FWB)
          </button>
          <button
            className={motsConnusTexte !== dernierMotsEnregistres ? 'plai-btn' : 'plai-btn-ghost'}
            style={motsConnusTexte !== dernierMotsEnregistres ? { background: '#f97316' } : undefined}
            onClick={enregistrerMotsConnus} disabled={enregistrementMots || chargementMots}
          >
            {enregistrementMots ? 'Enregistrement…' : motsEnregistres && motsConnusTexte === dernierMotsEnregistres ? 'Liste enregistrée' : 'Enregistrer cette liste'}
          </button>
        </div>
        {!chargementMots && motsConnusTexte === dernierMotsEnregistres && motsConnusTexte && (
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
            Cette liste sert de référence pour toutes vos prochaines générations tant qu'elle reste
            enregistrée — pensez à cliquer sur « Enregistrer cette liste » après chaque ajout, sans
            quoi les nouveaux mots resteront temporaires.
          </p>
        )}
      </div>

      <div className="plai-field">
        <label className="plai-label" htmlFor="sujet-generation">Sujet du texte</label>
        <input
          id="sujet-generation" name="sujet-generation"
          className="plai-input" type="text" value={sujet} onChange={e => setSujet(e.target.value)}
          placeholder="Ex. : la rentrée des classes, un animal de la ferme, un anniversaire"
        />
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
          Le thème que l'IA doit développer dans le texte généré. Restez concret et proche du vécu
          des élèves pour un texte plus motivant.
        </p>
      </div>

      <div className="plai-field">
        <label className="plai-label" htmlFor="contexte-generation">Période de l'année / échéance (facultatif)</label>
        <input
          id="contexte-generation" name="contexte-generation"
          className="plai-input" type="text" value={contexte} onChange={e => setContexte(e.target.value)}
          placeholder="Ex. : rentrée de septembre, fin d'année (juin), préparation à l'épreuve externe"
        />
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
          Indique le moment de l'année scolaire ou une échéance (épreuve, évaluation) — pas un simple
          thème. Un P1 de septembre n'a pas le même niveau réel qu'un P1 de juin : cette information
          aide l'IA à calibrer la complexité et le vocabulaire attendus, en plus d'ancrer le texte dans
          le vécu de la classe.
        </p>
      </div>

      <div className="plai-field">
        <label className="plai-label" htmlFor="longueur-generation">Longueur du texte</label>
        <select
          id="longueur-generation" name="longueur-generation"
          className="plai-input" value={longueurMots} onChange={e => setLongueurMots(Number(e.target.value))}
        >
          {LONGUEURS.map(l => <option key={l.valeur} value={l.valeur}>{l.label}</option>)}
        </select>
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
          Nombre de mots visé — l'IA s'en approche mais peut légèrement s'en écarter.
        </p>
      </div>

      <button className="plai-btn" onClick={genererTexte} disabled={loading || !sujet || rangsConnus.length === 0}>
        {loading ? 'Génération…' : 'Générer un texte'}
      </button>
      {rangsConnus.length === 0 && (
        <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
          Cochez au moins une correspondance graphème-phonème avant de générer.
        </p>
      )}

      {essais.length > 0 && (
        <div className="plai-card" style={{ marginTop: '1rem' }}>
          <p className="plai-label">Essais de génération (seuil visé : {SEUIL}%)</p>
          <ul>
            {essais.map(e => (
              <li key={e.tentative}>Essai {e.tentative} : {e.score}% de part déchiffrable</li>
            ))}
          </ul>
        </div>
      )}

      {texteGenere && (
        <div className="plai-field" role="status" aria-live="polite">
          <label className="plai-label" htmlFor="texte-genere">
            Texte proposé — {scoreObtenu}% de part déchiffrable
          </label>
          {scoreObtenu < SEUIL && (
            <div className="plai-error" style={{ marginBottom: '0.5rem' }}>
              Seuil de {SEUIL}% non atteint{texteGenere === essais[essais.length - 1]?.texte
                ? ` après ${essais.length} essai${essais.length > 1 ? 's' : ''} — le meilleur résultat obtenu est affiché ci-dessous`
                : ' — le texte modifié est repassé sous le seuil visé'}.
            </div>
          )}
          <textarea
            id="texte-genere" name="texte-genere"
            className="plai-input" rows={10}
            value={texteGenere} disabled={saved}
            onChange={e => {
              const nouveauTexte = e.target.value
              setTexteGenere(nouveauTexte)
              const resultat = partDechiffrable(nouveauTexte, rangsConnus, parserMotsConnus(motsConnusTexte))
              setScoreObtenu(resultat?.pourcentage ?? null)
              setCouvertureObtenue(resultat?.couverture ?? null)
              setMotsNonConformesObtenus(resultat?.motsNonConformes ?? [])
            }}
          />
          {couvertureObtenue && (
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
              Fiabilité du calcul : {couvertureObtenue.manulemme} mot(s) vérifié(s) précisément,{' '}
              {couvertureObtenue.normalise} par déduction morphologique, {couvertureObtenue.approx} en
              estimation approximative.
            </p>
          )}
          {motsNonConformesObtenus.length > 0 && (
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
              Mots contenant des sons non encore connus : {motsNonConformesObtenus.join(', ')}
            </p>
          )}
          {scoreObtenu >= SEUIL_PROPOSER_AJUSTEMENT && (
            <button className="plai-btn-ghost" style={{ marginTop: '0.5rem' }} onClick={ajusterVersHaut} disabled={loading}>
              Ajuster pour se rapprocher de {SEUIL}%
            </button>
          )}
          <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
            Ajustez le vocabulaire, le style et les exemples réels de vos élèves avant d'enregistrer —
            c'est cette version modifiée, pas la proposition brute de l'IA, qui sera sauvegardée.
          </p>
          <button
            className="plai-btn" style={{ marginTop: '0.75rem' }}
            onClick={enregistrer} disabled={saving || saved}
          >
            {saved ? 'Enregistré' : saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      )}
    </div>
  )
}
