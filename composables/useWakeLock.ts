import { ref } from 'vue'

// Mantiene la pantalla encendida con la Wake Lock API. En navegadores sin soporte no hace nada.
export default function () {
    const isActive = ref(false)
    let sentinel: any = null

    const isSupported = (): boolean =>
        typeof navigator !== 'undefined' && 'wakeLock' in navigator

    const request = async () => {
        if (!isSupported() || sentinel || document.visibilityState !== 'visible') return
        try {
            // @ts-ignore
            const lock = await navigator.wakeLock.request('screen')
            sentinel = lock
            isActive.value = true
            // El sistema lo libera al cambiar de app; se vuelve a pedir al regresar
            lock.addEventListener('release', () => {
                if (sentinel === lock) sentinel = null
                isActive.value = false
            })
        } catch (e) {
            isActive.value = false
        }
    }

    const release = async () => {
        const lock = sentinel
        sentinel = null
        isActive.value = false
        if (lock) {
            try {
                await lock.release()
            } catch (e) {
                // ya estaba liberado
            }
        }
    }

    return { isActive, isSupported, request, release }
}
