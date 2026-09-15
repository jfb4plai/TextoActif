import { describe, it, expect } from 'vitest'
import { chercherMot } from './manulemme'

describe('chercherMot', () => {
  it('retrouve "le" avec sa segmentation grapho-phonémique', () => {
    expect(chercherMot('le')).toEqual({ graphemes: ['l', 'e'], codes: ['l', '%'] })
  })

  it('retrouve "un" comme un graphème unique', () => {
    expect(chercherMot('un')).toEqual({ graphemes: ['un'], codes: ['1'] })
  })

  it('retourne null pour un mot absent du lexique', () => {
    expect(chercherMot('zzzxyz')).toBeNull()
  })
})
