export default function LogoPlai({ size = 'md' }) {
  const hauteurs = { sm: 24, md: 32, lg: 40 }
  const hauteur = hauteurs[size]
  return (
    <img
      src="/plai-logo.jpg"
      alt="PLAI — Pôle Liégeois d'Accompagnement vers une École Inclusive"
      style={{ height: `${hauteur}px`, width: 'auto' }}
    />
  )
}
