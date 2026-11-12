import type useCountdown from '~/composables/useCountdown'

// Guardado de los tiempos de un timer en marcha (SPEC 10): cada 15 s, al pausar y al salir.
// `save` recibe las centésimas restantes de cada jugador; TimerStore.syncTimeValues no escribe si
// nada cambió desde lo último guardado, así que en pausa el intervalo no genera escrituras.

export const AUTO_SAVE_INTERVAL_MS = 15000

type Countdown = ReturnType<typeof useCountdown>

export default function (countdown: Countdown, playerCount: () => number, save: (timeValues: number[]) => void,
                         intervalMs: number = AUTO_SAVE_INTERVAL_MS) {
    let interval: ReturnType<typeof setInterval> | null = null

    const saveNow = () => {
        save(Array.from({ length: playerCount() }, (_, i) => countdown.centisecondsNow(i)))
    }

    const start = () => {
        if (interval) return
        interval = setInterval(saveNow, intervalMs)
    }

    const stop = () => {
        if (interval) clearInterval(interval)
        interval = null
    }

    // Pausas que guardan enseguida
    const pause = (i: number) => {
        countdown.pause(i)
        saveNow()
    }

    const pauseAll = () => {
        countdown.pauseAll()
        saveNow()
    }

    return { start, stop, saveNow, pause, pauseAll }
}
