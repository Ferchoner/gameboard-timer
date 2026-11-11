import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import useCountdown from '~/composables/useCountdown'

const MIN = 60 * 1000

describe('useCountdown', () => {
    let countdown

    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-11-11T12:00:00Z'))
        countdown = useCountdown()
        countdown.init([10, 10, 10])
    })

    afterEach(() => {
        countdown.dispose()
        vi.useRealTimers()
    })

    it('inicia con el tiempo de cada jugador en centésimas', () => {
        expect(countdown.centisecondsNow(0)).toBe(10 * 6000)
        expect(countdown.isRunning(0)).toBe(false)
    })

    it('descuenta solo al jugador iniciado y se detiene al pausar', () => {
        countdown.start(0)
        vi.advanceTimersByTime(MIN)
        expect(countdown.centisecondsNow(0)).toBe(9 * 6000)
        expect(countdown.centisecondsNow(1)).toBe(10 * 6000)

        countdown.pause(0)
        vi.advanceTimersByTime(MIN)
        expect(countdown.centisecondsNow(0)).toBe(9 * 6000)
        expect(countdown.isRunning(0)).toBe(false)
    })

    it('reanuda desde donde se pausó', () => {
        countdown.start(0)
        vi.advanceTimersByTime(30 * 1000)
        countdown.pause(0)
        countdown.start(0)
        vi.advanceTimersByTime(30 * 1000)
        expect(countdown.centisecondsNow(0)).toBe(9 * 6000)
    })

    it('descuenta el tiempo real aunque el intervalo no se ejecute (segundo plano)', () => {
        countdown.start(0)
        // Simula un navegador que congela los intervalos: el reloj avanza sin correr timers
        vi.setSystemTime(Date.now() + 2 * MIN)
        expect(countdown.centisecondsNow(0)).toBe(8 * 6000)
        countdown.refresh()
        expect(countdown.centiseconds(0)).toBe(8 * 6000)
    })

    it('al llegar a 0 se detiene y avisa una sola vez', () => {
        const finished = vi.fn()
        countdown.onFinish(finished)
        countdown.start(1)
        vi.advanceTimersByTime(11 * MIN)
        expect(countdown.centisecondsNow(1)).toBe(0)
        expect(countdown.isRunning(1)).toBe(false)
        expect(countdown.hasTime(1)).toBe(false)
        expect(finished).toHaveBeenCalledTimes(1)
        expect(finished).toHaveBeenCalledWith(1)
    })

    it('no arranca a un jugador sin tiempo', () => {
        countdown.init([0, 10])
        expect(countdown.start(0)).toBe(false)
        expect(countdown.isRunning(0)).toBe(false)
    })

    it('reset y resetAll devuelven el tiempo indicado y detienen el reloj', () => {
        countdown.start(0)
        countdown.start(1)
        vi.advanceTimersByTime(MIN)
        countdown.reset(0, 15)
        expect(countdown.centisecondsNow(0)).toBe(15 * 6000)
        expect(countdown.isRunning(0)).toBe(false)
        expect(countdown.isRunning(1)).toBe(true)

        countdown.resetAll(20)
        expect([0, 1, 2].map(i => countdown.centisecondsNow(i))).toEqual([120000, 120000, 120000])
        expect(countdown.anyRunning()).toBe(false)
    })

    it('no deja intervalos vivos al pausar todo ni tras dispose', () => {
        countdown.start(0)
        countdown.start(2)
        expect(vi.getTimerCount()).toBe(1)
        countdown.pauseAll()
        expect(vi.getTimerCount()).toBe(0)
        countdown.start(0)
        countdown.dispose()
        expect(vi.getTimerCount()).toBe(0)
    })
})
