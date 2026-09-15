import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Historique() {
  const [textes, setTextes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ouvertId, setOuvertId] = useState(null)
  const [confirmationId, setConfirmationId] = useState(null)
  const [suppression, setSuppression] = useState({})

  useEffect(() => {
    async function charger() {
      const { data, error } = await supabase
        .from('texto_textes')
        .select('id, titre, sujet, contexte, niveau_cible, score_dechiffrable, texte, created_at')
        .order('created_at', { ascending: false })
      if (error) setError(error.message)
      setTextes(data || [])
      setLoading(false)
    }
    charger()
  }, [])

  async function supprimer(id) {
    setSuppression(s => ({ ...s, [id]: { loading: true } }))
    const { error } = await supabase.from('texto_textes').delete().eq('id', id)
    if (error) {
      setSuppression(s => ({ ...s, [id]: { loading: false, error: error.message } }))
      return
    }
    setTextes(t => t.filter(item => item.id !== id))
    setConfirmationId(null)
    setSuppression(s => {
      const { [id]: _retire, ...reste } = s
      return reste
    })
    if (ouvertId === id) setOuvertId(null)
  }

  if (loading) return <div className="plai-empty" role="status">Chargement…</div>
  if (error) return <div className="plai-error" role="alert">Impossible de charger l'historique : {error}</div>
  if (textes.length === 0) return <div className="plai-empty">Aucun texte généré pour l'instant.</div>

  return (
    <div className="plai-section">
      <h2>Historique</h2>
      {textes.map(t => {
        const ouvert = ouvertId === t.id
        const enConfirmation = confirmationId === t.id
        const etatSuppression = suppression[t.id]
        return (
          <div key={t.id} className="plai-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <button
                onClick={() => setOuvertId(ouvert ? null : t.id)}
                aria-expanded={ouvert}
                style={{ background: 'none', border: 'none', padding: 0, textAlign: 'left', flex: 1, cursor: 'pointer' }}
              >
                <p><strong>{t.titre}</strong> — {t.niveau_cible} — {t.sujet}{t.contexte ? ` (${t.contexte})` : ''}</p>
                <p style={{ fontSize: '13px', color: 'var(--text2)' }}>
                  {t.score_dechiffrable != null ? `${t.score_dechiffrable}% de part déchiffrable` : 'Score non disponible'}
                  {' — '}{new Date(t.created_at).toLocaleDateString('fr-BE')}
                  {' — '}{ouvert ? 'Masquer' : 'Voir le texte'}
                </p>
              </button>
              {!enConfirmation && (
                <button
                  className="plai-btn-ghost"
                  style={{ flexShrink: 0, fontSize: '13px', color: 'var(--text3)' }}
                  onClick={() => setConfirmationId(t.id)}
                  aria-label={`Supprimer « ${t.titre} »`}
                >
                  Supprimer
                </button>
              )}
            </div>

            {enConfirmation && (
              <div role="alert" style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <p style={{ fontSize: '14px' }}>Supprimer définitivement ce texte ? Cette action est irréversible.</p>
                {etatSuppression?.error && (
                  <div className="plai-error" role="alert" style={{ marginTop: '0.5rem' }}>
                    Suppression impossible : {etatSuppression.error}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button
                    className="plai-btn" style={{ background: '#b91c1c' }}
                    disabled={etatSuppression?.loading}
                    onClick={() => supprimer(t.id)}
                  >
                    {etatSuppression?.loading ? 'Suppression…' : 'Confirmer la suppression'}
                  </button>
                  <button className="plai-btn-ghost" disabled={etatSuppression?.loading} onClick={() => setConfirmationId(null)}>
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {ouvert && (
              <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>{t.texte}</p>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
