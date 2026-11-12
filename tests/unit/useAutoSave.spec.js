import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import useCountdown from '~/composables/useCountdown'
import useAutoSave, { AUTO_SAVE_INTERVAL_MS } from '~/composables/useAutoSave'

const SEC = 1000

describe('useAutoSave (SPEC 10)', () => {
    let countdown, autoSave, save

    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-11-12T12:00:00Z'))
        countdown = useCountdown()
        countdown.init([10, 10])
        save = vi.fn()
        autoSave = useAutoSave(countdown, () => 2, save)
        autoSave.start()
    })

    afterEach(() => {
        autoSave.stop()
        countdown.dispose()
        vi.useRealTimers()
    })

    it('guarda cada 15 s, no cada 5 s', () => {
        expect(AUTO_SAVE_INTERVAL_MS).toBe(15000)
        countdown.start(0)
        vi.advanceTimersByTime(14 * SEC)
        expect(save).not.toHaveBeenCalled()
        vi.advanceTimersByTime(1 * SEC)
        expect(save).toHaveBeenCalledTimes(1)
        expect(save).toHaveBeenLastCalledWith([10 * 6000 - 1500, 10 * 6000])
    })

    it('al pausar un jugador guarda enseguida sus tiempos', () => {
        countdown.start(1)
        vi.advanceTimersByTime(3 * SEC)
        autoSave.pause(1)
        expect(countdown.isRunning(1)).toBe(false)
        expect(save).toHaveBeenCalledTimes(1)
        expect(save).toHaveBeenLastCalledWith([10 * 6000, 10 * 6000 - 300])
    })

    it('al pausar todos (Continuous: pausa o siguiente) guarda enseguida', () => {
        countdown.start(0)
        vi.advanceTimersByTime(2 * SEC)
        autoSave.pauseAll()
        expect(countdown.anyRunning()).toBe(false)
        expect(save).toHaveBeenLastCalledWith([10 * 6000 - 200, 10 * 6000])
    })

    it('stop corta el guardado periódico', () => {
        autoSave.stop()
        vi.advanceTimersByTime(60 * SEC)
        expect(save).not.toHaveBeenCalled()
    })
})
