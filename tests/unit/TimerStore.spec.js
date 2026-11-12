import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useTimerStore, Timer, Player, MIN_PLAYERS, MAX_PLAYERS, timerKey } from '~/stores/TimerStore'
import { useUserStore } from '~/stores/UserStore'
import { useMainStore } from '~/stores/MainStore'

// useFirestore es un auto-import de Nuxt: en Vitest se simula como global
const firestore = {
    setDocument: vi.fn(async () => {}),
    updateDocument: vi.fn(async () => {}),
    deleteDocument: vi.fn(async () => {}),
    docRef: vi.fn((collection, id) => ({ id })),
    addToArray: vi.fn((...values) => ({ add: values })),
    removeFromArray: vi.fn((...values) => ({ remove: values }))
}

const login = () => {
    const userStore = useUserStore()
    userStore.user = { ...userStore.user, uid: 'uid-test', email: 'ana@example.com', guest: false, timers: [] }
    userStore.usrChecked = true
    return userStore
}

describe('Timer y Player', () => {
    it('un Player sin datos usa 25 minutos, nombre y color aleatorios', () => {
        const player = new Player()
        expect(player.timeValue).toBe(25)
        expect(player.currentTime).toBe(25)
        expect(player.name).toBeTruthy()
        expect(player.color).toBeTruthy()
    })

    it('un Timer creado con un título tiene 2 jugadores', () => {
        const timer = new Timer('Catan')
        expect(timer.title).toBe('Catan')
        expect(timer.players).toHaveLength(2)
        expect(timer.progresive).toBe(false)
    })
})

describe('timerKey (SPEC 09)', () => {
    it('da 20 caracteres alfanuméricos', () => {
        for (let i = 0; i < 200; i++) expect(timerKey()).toMatch(/^[A-Za-z0-9]{20}$/)
    })

    it('no repite en 1000 ids seguidos', () => {
        const keys = new Set(Array.from({ length: 1000 }, () => timerKey()))
        expect(keys.size).toBe(1000)
    })
})

describe('TimerStore', () => {
    let store

    beforeEach(() => {
        setActivePinia(createPinia())
        vi.stubGlobal('useFirestore', () => firestore)
        Object.values(firestore).forEach(fn => fn.mockClear())
        firestore.updateDocument.mockImplementation(async () => {})
        store = useTimerStore()
        store.addTimer('Catan', useUserStore())
    })

    it('addPlayer agrega un jugador con el tiempo actual del timer', () => {
        store.timers[0].players[0].timeValue = 60
        store.addPlayer(0)
        const players = store.timers[0].players
        expect(players).toHaveLength(3)
        expect(players[2].timeValue).toBe(60)
        expect(players[2].currentTime).toBe(60)
    })

    it(`addPlayer no pasa de ${MAX_PLAYERS} jugadores`, () => {
        for (let i = 0; i < 20; i++) store.addPlayer(0)
        expect(store.timers[0].players).toHaveLength(MAX_PLAYERS)
    })

    it('removePlayer quita al último y conserva al primero', () => {
        store.addPlayer(0)
        const [first, second] = store.timers[0].players.map(p => p.name)
        store.removePlayer(0)
        expect(store.timers[0].players.map(p => p.name)).toEqual([first, second])
    })

    it(`removePlayer no baja de ${MIN_PLAYERS} jugador`, () => {
        for (let i = 0; i < 5; i++) store.removePlayer(0)
        expect(store.timers[0].players).toHaveLength(MIN_PLAYERS)
    })

    it('applySharedTime iguala todos los tiempos al del primero, como número', () => {
        store.timers[0].players[0].timeValue = '60'
        store.applySharedTime(0)
        for (const player of store.timers[0].players) {
            expect(player.timeValue).toBe(60)
            expect(player.currentTime).toBe(60)
        }
    })

    it('syncTimer como invitado aplica el tiempo común sin llamar a Firestore', () => {
        store.timers[0].players[0].timeValue = 45
        store.syncTimer(0)
        expect(store.timers[0].players.every(p => p.currentTime === 45)).toBe(true)
        expect(firestore.updateDocument).not.toHaveBeenCalled()
    })

    it('syncTimer con sesión guarda el timer en Firestore con tiempos numéricos', () => {
        login()
        store.timers[0].FSid = 'uid-test-abcde'
        store.timers[0].players[0].timeValue = '30'
        store.syncTimer(0)
        expect(firestore.updateDocument).toHaveBeenCalledTimes(1)
        const [collection, id, data] = firestore.updateDocument.mock.calls[0]
        expect(collection).toBe('Timers')
        expect(id).toBe('uid-test-abcde')
        expect(data.players.map(p => p.timeValue)).toEqual([30, 30])
    })

    it('con sesión, un timer nuevo se guarda con id uid- más 20 caracteres y sin repetir (SPEC 09)', async () => {
        const userStore = login()
        store.addTimer('Azul', userStore)
        store.addTimer('Catan', userStore)
        await vi.waitFor(() => expect(firestore.setDocument).toHaveBeenCalledTimes(2))
        const ids = firestore.setDocument.mock.calls.map(([, id]) => id)
        ids.forEach(id => expect(id).toMatch(/^uid-test-[A-Za-z0-9]{20}$/))
        expect(ids[0]).not.toBe(ids[1])
        expect(firestore.setDocument.mock.calls[0][2].FSid).toBe(ids[0])
    })

    it('removeTimer mantiene el índice del modal dentro de la lista', () => {
        store.addTimer('Azul', useUserStore())
        store.index = 1
        store.removeTimer(1)
        expect(store.timers).toHaveLength(1)
        expect(store.index).toBe(0)
        store.removeTimer(0)
        expect(store.timers).toHaveLength(0)
        expect(store.index).toBe(0)
    })

    it('como invitado agregar y borrar timers no llama a Firestore', () => {
        store.addTimer('Azul', useUserStore())
        store.removeTimer(1)
        expect(firestore.setDocument).not.toHaveBeenCalled()
        expect(firestore.deleteDocument).not.toHaveBeenCalled()
    })

    // 2 jugadores de 25 minutos = 150000 centésimas cada uno
    const FULL = 25 * 6000

    it('syncTimeValues no escribe si los tiempos no cambiaron (timer en pausa)', async () => {
        login()
        store.timers[0].FSid = 'uid-test-abcde'
        await store.syncTimeValues(0, [FULL, FULL])
        expect(firestore.updateDocument).not.toHaveBeenCalled()
    })

    it('syncTimeValues escribe una vez por cambio y guarda currentTime en minutos', async () => {
        login()
        store.timers[0].FSid = 'uid-test-abcde'
        await store.syncTimeValues(0, [FULL - 500, FULL])
        await store.syncTimeValues(0, [FULL - 500, FULL])
        expect(firestore.updateDocument).toHaveBeenCalledTimes(1)
        const [, id, data] = firestore.updateDocument.mock.calls[0]
        expect(id).toBe('uid-test-abcde')
        expect(data.players.map(p => p.currentTime)).toEqual([(FULL - 500) / 6000, 25])

        await store.syncTimeValues(0, [FULL - 1000, FULL])
        expect(firestore.updateDocument).toHaveBeenCalledTimes(2)
    })

    it('syncTimeValues como invitado no llama a Firestore', async () => {
        await store.syncTimeValues(0, [FULL - 500, FULL])
        expect(firestore.updateDocument).not.toHaveBeenCalled()
    })

    it('borrar un timer con sesión quita su referencia por id, no por posición', async () => {
        const userStore = login()
        store.timers[0].FSid = 'uid-test-bbbbb'
        userStore.user.timers = [{ id: 'uid-test-aaaaa' }, { id: 'uid-test-bbbbb' }]
        store.removeTimer(0)
        await vi.waitFor(() => expect(firestore.updateDocument).toHaveBeenCalled())
        expect(firestore.deleteDocument).toHaveBeenCalledWith('Timers', 'uid-test-bbbbb')
        const [collection, uid, data] = firestore.updateDocument.mock.calls[0]
        expect([collection, uid]).toEqual(['Users', 'uid-test'])
        expect(data.timers).toEqual({ remove: [{ id: 'uid-test-bbbbb' }] })
        expect(userStore.user.timers).toEqual([{ id: 'uid-test-aaaaa' }])
    })

    it('si una escritura falla, avisa con saveError y no lanza el error', async () => {
        login()
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        firestore.updateDocument.mockImplementation(async () => { throw new Error('permission-denied') })
        store.timers[0].FSid = 'uid-test-abcde'
        await expect(store.syncTimer(0)).resolves.toBeNull()
        expect(useMainStore().saveError).toBe(true)
        useMainStore().dismissSaveError()
        expect(useMainStore().saveError).toBe(false)
    })
})
