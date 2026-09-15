import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LogoPlai from './LogoPlai'

export default function Layout({ children }) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  return (
    <div>
      <nav className="plai-nav">
        <Link to="/generateur" className="plai-nav-logo">
          <LogoPlai size="sm" />
          TextoActif
        </Link>
        <div className="plai-nav-actions">
          <Link to="/generateur" className="plai-nav-link">Générer</Link>
          <Link to="/historique" className="plai-nav-link">Historique</Link>
          <Link to="/references" className="plai-nav-link">Références</Link>
          <button onClick={handleSignOut} className="plai-nav-link">Déconnexion</button>
        </div>
      </nav>
      <main className="plai-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
        {children}
      </main>
      <footer className="plai-footer">
        <p>TextoActif — PLAI, Pôle Liégeois d'Accompagnement vers une École Inclusive</p>
      </footer>
    </div>
  )
}
