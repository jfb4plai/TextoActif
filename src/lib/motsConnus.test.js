import { describe, it, expect } from 'vitest'
import { normaliserMotsConnus, parserMotsConnus, LISTE_HAUTE_FREQUENCE_REFERENCE } from './motsConnus'

describe('normaliserMotsConnus', () => {
  it('retire les espaces superflus et les entrées vides', () => {
    expect(normaliserMotsConnus([' monsieur ', '', '  ', 'papa'])).toEqual(['monsieur', 'papa'])
  })

  it('déduplique sans tenir compte de la casse, en gardant la première occurrence', () => {
    expect(normaliserMotsConnus(['Monsieur', 'monsieur', 'MONSIEUR'])).toEqual(['Monsieur'])
  })
})

describe('parserMotsConnus', () => {
  it('découpe sur les retours à la ligne et les virgules', () => {
    expect(parserMotsConnus('le\nun, de\nil')).toEqual(['le', 'un', 'de', 'il'])
  })
})

describe('LISTE_HAUTE_FREQUENCE_REFERENCE', () => {
  it('contient la liste officielle du référentiel FWB (p.41), non vide', () => {
    expect(LISTE_HAUTE_FREQUENCE_REFERENCE.length).toBeGreaterThan(40)
    expect(LISTE_HAUTE_FREQUENCE_REFERENCE).toContain('un')
  })
})
