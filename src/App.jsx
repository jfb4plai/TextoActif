import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import NouveauMotDePasse from './pages/NouveauMotDePasse'

// Chargées à la demande : Generateur embarque le lexique ManuLemme complet
// (plusieurs Mo de JSON) via lib/manulemme.js. Sans ce découpage, ce poids
// serait inclus dans le bundle de /login, chargé avant même qu'un enseignant
// soit connecté.
const Generateur = lazy(() => import('./pages/Generateur'))
const Historique = lazy(() => import('./pages/Historique'))
const References = lazy(() => import('./pages/References'))

function AppRoutes() {
  const { user, loading, passwordRecovery } = useAuth()

  if (loading) {
    return <div className="plai-empty">Chargement…</div>
  }

  if (passwordRecovery) {
    return <NouveauMotDePasse />
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  return (
    <Layout>
      <Suspense fallback={<div className="plai-empty" role="status">Chargement…</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/generateur" replace />} />
          <Route path="/generateur" element={<Generateur />} />
          <Route path="/historique" element={<Historique />} />
          <Route path="/references" element={<References />} />
          <Route path="*" element={<Navigate to="/generateur" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
