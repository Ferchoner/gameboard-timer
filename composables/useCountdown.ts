import { ref, reactive } from 'vue'

// Reloj por jugador basado en Date.now(): el tiempo restante se calcula, no se cuenta por ticks,
// así que sigue siendo correcto aunque el navegador frene los intervalos en segundo plano.

type Clock = {
    remainingMs: number        // tiempo restante al último inicio o pausa
    startedAt: number | null   // Date.now() al iniciar; null si está en pausa
    finished: boolean          // llegó a 0
}

const REFRESH_MS = 250

export default function () {
    const now = ref(Date.now())
    const clocks = reactive<Clock[]>([])
    const finishCallbacks: Array<(index: number) => void> = []
    let ticker: ReturnType<typeof setInterval> | null = null

    const msLeft = (i: number, at: number = Date.now()): number => {
        const clock = clocks[i]
        if (!clock) return 0
        if (clock.startedAt === null) return clock.remainingMs
        return Math.max(clock.remainingMs - (at - clock.startedAt), 0)
    }

    const isRunning = (i: number): boolean => !!clocks[i] && clocks[i].startedAt !== null
    const anyRunning = (): boolean => clocks.some(clock => clock.startedAt !== null)
    const hasTime = (i: number): boolean => msLeft(i) > 0

    const stopTicker = () => {
        if (ticker) {
            clearInterval(ticker)
            ticker = null
        }
    }

    // Actualiza la pantalla y detecta a los jugadores que llegaron a 0
    const refresh = () => {
        const at = Date.now()
        now.value = at
        clocks.forEach((clock, i) => {
            if (clock.startedAt !== null && msLeft(i, at) <= 0) {
                clock.remainingMs = 0
                clock.startedAt = null
                clock.finished = true
                finishCallbacks.forEach(callback => callback(i))
            }
        })
        if (!anyRunning()) stopTicker()
    }

    const startTicker = () => {
        if (!ticker) ticker = setInterval(refresh, REFRESH_MS)
    }

    const newClock = (minutes: number): Clock => ({
        remainingMs: Math.max(Number(minutes) || 0, 0) * 60000,
        startedAt: null,
        finished: false
    })

    const init = (minutesPerPlayer: number[]) => {
        stopTicker()
        clocks.splice(0, clocks.length, ...minutesPerPlayer.map(newClock))
        now.value = Date.now()
    }

    const start = (i: number): boolean => {
        const clock = clocks[i]
        if (!clock || !hasTime(i)) return false
        if (clock.startedAt === null) clock.startedAt = Date.now()
        now.value = Date.now()
        startTicker()
        return true
    }

    const pause = (i: number) => {
        const clock = clocks[i]
        if (!clock || clock.startedAt === null) return
        clock.remainingMs = msLeft(i)
        clock.startedAt = null
        now.value = Date.now()
        if (!anyRunning()) stopTicker()
    }

    const pauseAll = () => clocks.forEach((_, i) => pause(i))

    const reset = (i: number, minutes: number) => {
        if (!clocks[i]) return
        clocks[i] = newClock(minutes)
        now.value = Date.now()
        if (!anyRunning()) stopTicker()
    }

    const resetAll = (minutes: number) => {
        stopTicker()
        clocks.forEach((_, i) => { clocks[i] = newClock(minutes) })
        now.value = Date.now()
    }

    // Centésimas de segundo restantes: reactivo (para la pantalla) o exacto (para guardar)
    const centiseconds = (i: number): number => Math.floor(msLeft(i, now.value) / 10)
    const centisecondsNow = (i: number): number => Math.floor(msLeft(i) / 10)

    const onFinish = (callback: (index: number) => void) => {
        finishCallbacks.push(callback)
    }

    const dispose = () => {
        stopTicker()
        finishCallbacks.splice(0, finishCallbacks.length)
    }

    return {
        init,
        start,
        pause,
        pauseAll,
        reset,
        resetAll,
        refresh,
        isRunning,
        anyRunning,
        hasTime,
        centiseconds,
        centisecondsNow,
        onFinish,
        dispose
    }
}
