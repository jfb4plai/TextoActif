import { describe, it, expect } from 'vitest'
import { toutesLesCorrespondances, correspondanceParRang, correspondanceParGraphemeEtCode } from './cgp'

describe('toutesLesCorrespondances', () => {
  it('retourne les 75 correspondances de la table de Riou (2017)', () => {
    expect(toutesLesCorrespondances()).toHaveLength(75)
  })
})

describe('correspondanceParRang', () => {
  it('retrouve la correspondance la plus fréquente (rang 1 = r)', () => {
    const c = correspondanceParRang(1)
    expect(c.variantes).toContain('r')
    expect(c.code).toBe('R')
  })

  it('retourne null pour un rang inexistant', () => {
    expect(correspondanceParRang(999)).toBeNull()
  })
})

describe('correspondanceParGraphemeEtCode', () => {
  it('désambiguïse "t" prononcé [t] (rang 5) de "t" muet (rang 22) et "t" prononcé [s] (rang 41)', () => {
    expect(correspondanceParGraphemeEtCode('t', 't').rang).toBe(5)
    expect(correspondanceParGraphemeEtCode('t', '#').rang).toBe(22)
    expect(correspondanceParGraphemeEtCode('t', 's').rang).toBe(41)
  })

  it('retrouve "un" (rang 66)', () => {
    expect(correspondanceParGraphemeEtCode('un', '1').rang).toBe(66)
  })

  it('retourne null si aucune ligne ne correspond', () => {
    expect(correspondanceParGraphemeEtCode('zz', 'Q')).toBeNull()
  })
})
