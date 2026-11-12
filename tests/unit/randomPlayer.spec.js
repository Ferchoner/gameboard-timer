import { describe, it, expect } from 'vitest'
import { PLAYER_NAMES, randomName, randomColor } from '~/utils/randomPlayer'
import { MAX_NAME_LENGTH } from '~/stores/TimerStore'

describe('randomPlayer (SPEC 10)', () => {
    it('la lista tiene unos 40 nombres, sin repetir y de 20 caracteres o menos', () => {
        expect(PLAYER_NAMES.length).toBeGreaterThanOrEqual(30)
        expect(new Set(PLAYER_NAMES).size).toBe(PLAYER_NAMES.length)
        PLAYER_NAMES.forEach(name => {
            expect(name.length).toBeGreaterThan(0)
            expect(name.length).toBeLessThanOrEqual(MAX_NAME_LENGTH)
        })
    })

    it('randomName da un nombre de la lista', () => {
        for (let i = 0; i < 200; i++) expect(PLAYER_NAMES).toContain(randomName())
    })

    it('randomColor da un hex #rrggbb', () => {
        for (let i = 0; i < 200; i++) expect(randomColor()).toMatch(/^#[0-9a-f]{6}$/)
    })
})
