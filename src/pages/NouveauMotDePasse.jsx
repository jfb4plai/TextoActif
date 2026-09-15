import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LogoPlai from '../components/LogoPlai'

export default function NouveauMotDePasse() {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const { updatePassword } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.')
      return
    }

    setLoading(true)
    const { error } = await updatePassword(password)
    setLoading(false)
    if (error) setError(error.message)
    else setSuccess(true)
  }

  return (
    <div className="plai-container" style={{ maxWidth: '420px', paddingTop: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <LogoPlai size="lg" />
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', marginTop: '1rem' }}>
          Nouveau mot de passe
        </h1>
      </div>

      <div className="plai-card">
        {error && <div className="plai-error" role="alert">{error}</div>}

        {success ? (
          <div className="plai-success" role="status">
            Mot de passe mis à jour. Rechargez la page pour retrouver l'application.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="plai-field">
              <label className="plai-label" htmlFor="nouveau-password">Nouveau mot de passe</label>
              <input
                id="nouveau-password" name="nouveau-password" autoComplete="new-password"
                className="plai-input" type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '4px' }}>
                Au moins 6 caractères.
              </p>
            </div>
            <div className="plai-field">
              <label className="plai-label" htmlFor="confirmation-password">Confirmer le mot de passe</label>
              <input
                id="confirmation-password" name="confirmation-password" autoComplete="new-password"
                className="plai-input" type="password" required
                value={confirmation} onChange={e => setConfirmation(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button className="plai-btn" type="submit" disabled={loading} style={{ width: '100%' }}>
              Valider le nouveau mot de passe
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
