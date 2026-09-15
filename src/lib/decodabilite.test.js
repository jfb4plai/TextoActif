import { describe, it, expect } from 'vitest'
import { partDechiffrable } from './decodabilite'

// rang 7 = l (l/ll), rang 28 = e muet (%), rang 66 = un (1) — vérifiés contre
// src/data/cgp.json et les entrées ManuLemme réelles de "le"/"un".

describe('partDechiffrable', () => {
  it('retourne null pour un texte vide', () => {
    expect(partDechiffrable('', [])).toBeNull()
  })

  it('crédite 100% quand toutes les correspondances du mot sont connues', () => {
    const resultat = partDechiffrable('le', [7, 28], [])
    expect(resultat.pourcentage).toBe(100)
  })

  it('crédite partiellement un mot dont une partie des graphèmes est connue', () => {
    // "le" = l (rang 7, connu) + e (rang 28, inconnu) → 1 graphème connu sur 2
    const resultat = partDechiffrable('le', [7], [])
    expect(resultat.pourcentage).toBe(50)
  })

  it('crédite 100% un mot de la liste de mots connus même sans correspondances cochées', () => {
    const resultat = partDechiffrable('le', [], ['le'])
    expect(resultat.pourcentage).toBe(100)
  })

  it('retrouve "un" (rang 66)', () => {
    const resultat = partDechiffrable('un', [66], [])
    expect(resultat.pourcentage).toBe(100)
  })

  it('compte plusieurs mots connus dans le même texte', () => {
    const resultat = partDechiffrable('le un', [7, 28, 66], [])
    expect(resultat.pourcentage).toBe(100)
    expect(resultat.couverture.manulemme).toBe(2)
  })

  it('signale un mot hors ManuLemme dans la couverture "approx"', () => {
    const resultat = partDechiffrable('zzxyqq', [], [])
    expect(resultat.couverture.approx).toBe(1)
  })
})
