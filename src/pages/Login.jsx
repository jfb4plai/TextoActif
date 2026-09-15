import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LogoPlai from '../components/LogoPlai'

export default function Login() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp, resetPasswordForEmail } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await signIn(email, password)
      if (error) {
        setError(
          error.message?.toLowerCase().includes('invalid login credentials')
            ? 'Email ou mot de passe incorrect.'
            : `Connexion impossible : ${error.message}`
        )
      }
      else navigate('/generateur')
    } else if (mode === 'register') {
      const { error } = await signUp(email, password)
      if (error) setError(error.message)
      else setSuccess('Compte créé. Vérifiez votre email pour confirmer votre inscription.')
    } else {
      const { error } = await resetPasswordForEmail(email)
      if (error) setError(error.message)
      else setSuccess("Si un compte existe pour cet email, un lien de réinitialisation vient d'être envoyé.")
    }
    setLoading(false)
  }

  return (
    <div className="plai-container" style={{ maxWidth: '420px', paddingTop: '4rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <LogoPlai size="lg" />
        <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '28px', marginTop: '1rem' }}>
          TextoActif
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: '14px' }}>Textes adaptés au décodage — PLAI</p>
      </div>

      <div className="plai-card">
        {error && <div className="plai-error" role="alert">{error}</div>}
        {success && <div className="plai-success" role="alert">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="plai-field">
            <label className="plai-label" htmlFor="email">Email</label>
            <input
              id="email" name="email" autoComplete="email"
              className="plai-input" type="email" required
              value={email} onChange={e => setEmail(e.target.value)}
              placeholder="prenom.nom@etablissement.be"
            />
          </div>
          {mode !== 'forgot' && (
            <div className="plai-field">
              <label className="plai-label" htmlFor="password">Mot de passe</label>
              <input
                id="password" name="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="plai-input" type="password" required
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          )}
          {mode === 'forgot' && (
            <p style={{ fontSize: '13px', color: 'var(--text2)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
              Vous recevrez un email avec un lien pour choisir un nouveau mot de passe.
            </p>
          )}
          <button className="plai-btn" type="submit" disabled={loading} style={{ width: '100%' }}>
            {mode === 'login' && 'Se connecter'}
            {mode === 'register' && 'Créer mon compte'}
            {mode === 'forgot' && 'Envoyer le lien de réinitialisation'}
          </button>
        </form>

        {mode === 'login' && (
          <button
            className="plai-btn-ghost"
            style={{ width: '100%', marginTop: '0.5rem' }}
            onClick={() => { setMode('forgot'); setError(''); setSuccess('') }}
          >
            Mot de passe oublié ?
          </button>
        )}

        <button
          className="plai-btn-ghost"
          style={{ width: '100%', marginTop: '0.5rem' }}
          onClick={() => { setMode(mode === 'register' ? 'login' : 'register'); setError(''); setSuccess('') }}
        >
          {mode === 'register' ? 'Déjà un compte ? Se connecter' : "Pas encore de compte ? S'inscrire"}
        </button>

        {mode === 'forgot' && (
          <button
            className="plai-btn-ghost"
            style={{ width: '100%', marginTop: '0.5rem' }}
            onClick={() => { setMode('login'); setError(''); setSuccess('') }}
          >
            Retour à la connexion
          </button>
        )}
      </div>
    </div>
  )
}
