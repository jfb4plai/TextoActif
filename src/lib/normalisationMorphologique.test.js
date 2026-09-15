import { describe, it, expect } from 'vitest'
import { formesCandidates } from './normalisationMorphologique'

describe('formesCandidates', () => {
  it('propose le mot tel quel en premier', () => {
    expect(formesCandidates('chat')[0]).toBe('chat')
  })

  it('propose la forme sans "s" pour un pluriel', () => {
    expect(formesCandidates('chats')).toContain('chat')
  })

  it('propose la forme sans "e" pour un féminin', () => {
    expect(formesCandidates('petite')).toContain('petit')
  })

  it('ne propose pas de forme vide pour un mot très court', () => {
    expect(formesCandidates('as')).not.toContain('')
  })
})
