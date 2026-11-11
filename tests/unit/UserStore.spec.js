import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useUserStore } from '~/stores/UserStore'
import { useTimerStore } from '~/stores/TimerStore'

// Documentos simulados de Firestore: { 'Users/ana': {...}, 'Timers/ana-a1B2c': {...} }
let docs
const snapshot = (path) => ({
    exists: () => path in docs,
    data: () => docs[path] && structuredClone(docs[path])
})

const firestore = {
    getDocument: vi.fn(async (collection, id) => snapshot(`${collection}/${id}`)),
    setDocument: vi.fn(async (collection, id, data) => { docs[`${collection}/${id}`] = { ...docs[`${collection}/${id}`], ...data } }),
    updateDocument: vi.fn(async () => {}),
    docRef: vi.fn((collection, id) => ({ id })),
    addToArray: vi.fn((...values) => ({ add: values })),
    removeFromArray: vi.fn((...values) => ({ remove: values })),
    removeField: vi.fn(() => 'DELETE_FIELD')
}

let authListener
const auth = {
    listenForAuth: vi.fn((callback) => { authListener = callback }),
    registerUser: vi.fn(async (email) => ({ user: { uid: 'ana', email } })),
    loginUser: vi.fn(async (email) => {
        const credential = { user: { uid: 'ana', email, displayName: 'Ana López' } }
        // Como Firebase: el listener se entera antes de que se resuelva el login
        authListener(credential.user)
        return credential
    }),
    updateUser: vi.fn(async () => {})
}

const ana = (extra = {}) => ({
    email: 'ana@example.com', username: 'ana', firstName: 'Ana', lastName: 'López',
    uid: 'ana', guest: false, timers: [], ...extra
})

beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('useFirestore', () => firestore)
    vi.stubGlobal('useFirebaseAuth', () => auth)
    Object.values(firestore).forEach(fn => fn.mockClear())
    Object.values(auth).forEach(fn => fn.mockClear())
    docs = {}
})

describe('UserStore', () => {
    it('el registro no guarda accessToken', async () => {
        const userStore = useUserStore()
        await userStore.register({ email: 'ana@example.com', password: 'secreto', firstName: 'Ana', lastName: 'López' })
        const [collection, id, data] = firestore.setDocument.mock.calls[0]
        expect([collection, id]).toEqual(['Users', 'ana'])
        expect(data).not.toHaveProperty('accessToken')
        expect(data).toMatchObject({ email: 'ana@example.com', firstName: 'Ana', timers: [] })
    })

    it('al iniciar sesión borra el accessToken guardado, solo si existe', async () => {
        docs['Users/ana'] = ana({ accessToken: 'token-viejo' })
        const userStore = useUserStore()
        await userStore.getUserData({ user: { uid: 'ana' } })
        expect(firestore.updateDocument).toHaveBeenCalledWith('Users', 'ana', { accessToken: 'DELETE_FIELD' })
        expect(userStore.user).not.toHaveProperty('accessToken')

        firestore.updateDocument.mockClear()
        docs['Users/ana'] = ana()
        await userStore.getUserData({ user: { uid: 'ana' } })
        expect(firestore.updateDocument).not.toHaveBeenCalled()
    })

    it('una cuenta sin documento en Users puede entrar y el documento se crea', async () => {
        const userStore = useUserStore()
        await userStore.getUserData({ user: { uid: 'ana', email: 'ana@example.com', displayName: 'Ana López' } })
        expect(firestore.setDocument).toHaveBeenCalledWith('Users', 'ana', expect.objectContaining({
            email: 'ana@example.com', firstName: 'Ana', lastName: 'López', uid: 'ana', timers: []
        }), { merge: true })
        expect(userStore.user.email).toBe('ana@example.com')
        expect(userStore.isGuest).toBe(false)
    })

    it('un timer referenciado que ya no existe no rompe la lista', async () => {
        docs['Users/ana'] = ana({ timers: [{ id: 'ana-aaaaa' }, { id: 'ana-borrado' }] })
        docs['Timers/ana-aaaaa'] = { FSid: 'ana-aaaaa', title: 'Catan', players: [] }
        const userStore = useUserStore()
        await userStore.getUserData({ user: { uid: 'ana' } })
        expect(useTimerStore().timers.map(t => t.title)).toEqual(['Catan'])
    })

    it('iniciar sesión carga los datos del usuario una sola vez', async () => {
        docs['Users/ana'] = ana()
        const userStore = useUserStore()
        userStore.listenAuth()
        const response = await userStore.login({ email: 'ana@example.com', password: 'secreto' })
        expect(response.user.uid).toBe('ana')
        expect(userStore.usrChecked).toBe(true)
        const userReads = firestore.getDocument.mock.calls.filter(([collection]) => collection === 'Users')
        expect(userReads).toHaveLength(1)
    })

    it('si no se pueden cargar los datos, la sesión queda sin comprobar (el loading avisa)', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {})
        firestore.getDocument.mockImplementationOnce(async () => { throw new Error('offline') })
        const userStore = useUserStore()
        userStore.listenAuth()
        await authListener({ uid: 'ana' })
        expect(userStore.usrChecked).toBe(false)
    })
})
