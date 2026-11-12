import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore'

let env

const player = (overrides = {}) => ({ name: 'Ana', color: '#a1b2c3', timeValue: 25, currentTime: 25, ...overrides })

// Igual que la clase Timer de stores/TimerStore.ts al guardarse con syncTimers
const timer = (FSid, overrides = {}) => ({
    FSid,
    title: 'New Timer',
    progresive: false,
    createdAt: new Date(),
    updateAt: new Date(),
    players: [player(), player({ name: 'Beto', color: '#7f06b6' })],
    ...overrides
})

// Igual que UserStore.register
const registeredUser = (uid, overrides = {}) => ({
    email: `${uid}@example.com`,
    username: uid,
    firstName: 'Ana',
    lastName: 'López',
    timers: [],
    guest: false,
    uid,
    ...overrides
})

// Ids con el formato de la SPEC 09: uid- más 20 caracteres alfanuméricos
const NEW_ID = 'ana-Q8fK2mZp0LwX7cVb4NsT'

beforeAll(async () => {
    env = await initializeTestEnvironment({
        projectId: 'demo-gameboard-timer',
        firestore: { rules: readFileSync('firestore.rules', 'utf8') }
    })
})

afterAll(async () => {
    await env?.cleanup()
})

// Datos de partida: Ana y Beto con un timer cada uno, escritos sin reglas
beforeEach(async () => {
    await env.clearFirestore()
    await env.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore()
        await setDoc(doc(db, 'Users', 'ana'), registeredUser('ana'))
        await setDoc(doc(db, 'Users', 'beto'), registeredUser('beto'))
        await setDoc(doc(db, 'Timers', 'ana-a1B2c'), timer('ana-a1B2c'))
        await setDoc(doc(db, 'Timers', 'beto-a1B2c'), timer('beto-a1B2c'))
    })
})

const asAna = () => env.authenticatedContext('ana').firestore()
const asGuest = () => env.unauthenticatedContext().firestore()

describe('Users: dueño', () => {
    it('Ana lee, crea y actualiza su propio documento', async () => {
        const db = asAna()
        await assertSucceeds(getDoc(doc(db, 'Users', 'ana')))
        await assertSucceeds(setDoc(doc(db, 'Users', 'ana'), registeredUser('ana')))
        await assertSucceeds(updateDoc(doc(db, 'Users', 'ana'), {
            timers: arrayUnion(doc(db, 'Timers', 'ana-a1B2c'))
        }))
    })

    it('Ana no puede leer, cambiar ni borrar el documento de Beto', async () => {
        const db = asAna()
        await assertFails(getDoc(doc(db, 'Users', 'beto')))
        await assertFails(updateDoc(doc(db, 'Users', 'beto'), { timers: [] }))
        await assertFails(setDoc(doc(db, 'Users', 'beto'), registeredUser('beto')))
        await assertFails(deleteDoc(doc(db, 'Users', 'beto')))
    })

    it('sin sesión no se puede leer ni escribir ningún usuario', async () => {
        const db = asGuest()
        await assertFails(getDoc(doc(db, 'Users', 'ana')))
        await assertFails(setDoc(doc(db, 'Users', 'nadie'), registeredUser('nadie')))
    })
})

describe('Users: lo que escribe la app', () => {
    it('registro con merge, como UserStore.register', async () => {
        const db = env.authenticatedContext('carla').firestore()
        await assertSucceeds(setDoc(doc(db, 'Users', 'carla'), registeredUser('carla'), { merge: true }))
    })

    it('documento mínimo de una cuenta sin documento, como UserStore.getUserData', async () => {
        const db = env.authenticatedContext('carla').firestore()
        await assertSucceeds(setDoc(doc(db, 'Users', 'carla'), {
            email: 'carla@example.com',
            username: 'carla',
            firstName: '',
            lastName: '',
            uid: 'carla',
            guest: false,
            timers: []
        }, { merge: true }))
    })

    it('quitar accessToken de una cuenta vieja con deleteField', async () => {
        await env.withSecurityRulesDisabled(async (context) => {
            await setDoc(doc(context.firestore(), 'Users', 'ana'), registeredUser('ana', { accessToken: 'viejo' }))
        })
        const db = asAna()
        await assertSucceeds(updateDoc(doc(db, 'Users', 'ana'), { accessToken: deleteField() }))
    })

    it('agregar y quitar referencias de timers, como UserStore.updateTimers', async () => {
        const db = asAna()
        await assertSucceeds(updateDoc(doc(db, 'Users', 'ana'), { timers: arrayUnion(doc(db, 'Timers', NEW_ID)) }))
        await assertSucceeds(updateDoc(doc(db, 'Users', 'ana'), { timers: arrayRemove(doc(db, 'Timers', NEW_ID)) }))
    })

    it('hasta 100 referencias de timers', async () => {
        const db = asAna()
        const refs = Array.from({ length: 100 }, (_, i) => doc(db, 'Timers', `ana-t${i}`))
        await assertSucceeds(updateDoc(doc(db, 'Users', 'ana'), { timers: refs }))
    })
})

describe('Users: datos inválidos', () => {
    const write = (data) => setDoc(doc(asAna(), 'Users', 'ana'), data)

    it('rechaza un campo extra', async () => {
        await assertFails(write(registeredUser('ana', { admin: true })))
    })

    it('rechaza que falte un campo obligatorio', async () => {
        const { timers, ...sinTimers } = registeredUser('ana')
        await assertFails(write(sinTimers))
        const { email, ...sinEmail } = registeredUser('ana')
        await assertFails(write(sinEmail))
    })

    it('rechaza un uid distinto del id del documento', async () => {
        await assertFails(write(registeredUser('ana', { uid: 'beto' })))
    })

    it('rechaza guest: true', async () => {
        await assertFails(write(registeredUser('ana', { guest: true })))
    })

    it('rechaza textos de más de 100 caracteres o que no son texto', async () => {
        await assertFails(write(registeredUser('ana', { firstName: 'a'.repeat(101) })))
        await assertFails(write(registeredUser('ana', { email: 42 })))
    })

    it('rechaza más de 100 timers o timers que no son lista', async () => {
        const db = asAna()
        const refs = Array.from({ length: 101 }, (_, i) => doc(db, 'Timers', `ana-t${i}`))
        await assertFails(updateDoc(doc(db, 'Users', 'ana'), { timers: refs }))
        await assertFails(write(registeredUser('ana', { timers: 'muchos' })))
    })

    it('rechaza agregar un campo extra con updateDoc', async () => {
        await assertFails(updateDoc(doc(asAna(), 'Users', 'ana'), { role: 'admin' }))
    })
})

describe('Timers: dueño', () => {
    it('Ana crea, lee, actualiza y borra sus timers', async () => {
        const db = asAna()
        await assertSucceeds(setDoc(doc(db, 'Timers', 'ana-Zz999'), timer('ana-Zz999')))
        await assertSucceeds(getDoc(doc(db, 'Timers', 'ana-a1B2c')))
        await assertSucceeds(updateDoc(doc(db, 'Timers', 'ana-a1B2c'), { title: 'Catan' }))
        await assertSucceeds(deleteDoc(doc(db, 'Timers', 'ana-a1B2c')))
    })

    it('Ana no puede leer, cambiar ni borrar los timers de Beto', async () => {
        const db = asAna()
        await assertFails(getDoc(doc(db, 'Timers', 'beto-a1B2c')))
        await assertFails(updateDoc(doc(db, 'Timers', 'beto-a1B2c'), { title: 'Mío' }))
        await assertFails(deleteDoc(doc(db, 'Timers', 'beto-a1B2c')))
        await assertFails(setDoc(doc(db, 'Timers', 'beto-Zz999'), timer('beto-Zz999')))
    })

    it('Ana no puede crear timers con un id fuera del formato uid-xxxxx', async () => {
        const db = asAna()
        await assertFails(setDoc(doc(db, 'Timers', 'ana'), timer('ana')))
        await assertFails(setDoc(doc(db, 'Timers', 'otra-cosa'), timer('otra-cosa')))
        await assertFails(setDoc(doc(db, 'Timers', 'ana-'), timer('ana-')))
        await assertFails(setDoc(doc(db, 'Timers', 'anabel-a1B2c'), timer('anabel-a1B2c')))
    })

    it('sin sesión no se puede leer ni escribir ningún timer', async () => {
        const db = asGuest()
        await assertFails(getDoc(doc(db, 'Timers', 'ana-a1B2c')))
        await assertFails(setDoc(doc(db, 'Timers', 'x-a1B2c'), timer('x-a1B2c')))
    })
})

describe('Timers: lo que escribe la app', () => {
    it('timer nuevo con id de 20 caracteres, como TimerStore.syncTimers', async () => {
        await assertSucceeds(setDoc(doc(asAna(), 'Timers', NEW_ID), timer(NEW_ID)))
    })

    it('guardar el timer entero desde el editor, como TimerStore.syncTimer', async () => {
        await assertSucceeds(updateDoc(doc(asAna(), 'Timers', 'ana-a1B2c'), timer('ana-a1B2c', {
            title: 'Catan',
            progresive: true,
            players: [player({ timeValue: 60, currentTime: 60 })]
        })))
    })

    it('guardar solo los tiempos, como TimerStore.syncTimeValues', async () => {
        await assertSucceeds(updateDoc(doc(asAna(), 'Timers', 'ana-a1B2c'), {
            players: [player({ currentTime: 12.3456 }), player({ name: 'Beto', currentTime: 0 })]
        }))
    })

    it('12 jugadores con títulos y nombres en el límite', async () => {
        const players = Array.from({ length: 12 }, (_, i) => player({ name: `${'n'.repeat(18)}${String(i).padStart(2, '0')}`, timeValue: 120, currentTime: 120 }))
        await assertSucceeds(setDoc(doc(asAna(), 'Timers', NEW_ID), timer(NEW_ID, { title: 't'.repeat(40), players })))
    })

    it('tiempos en los extremos del editor', async () => {
        await assertSucceeds(setDoc(doc(asAna(), 'Timers', NEW_ID), timer(NEW_ID, {
            players: [player({ timeValue: 10, currentTime: 10 })]
        })))
    })
})

describe('Timers: datos inválidos', () => {
    const write = (data) => setDoc(doc(asAna(), 'Timers', NEW_ID), data)

    it('rechaza un campo extra o que falte uno', async () => {
        await assertFails(write(timer(NEW_ID, { owner: 'beto' })))
        const { createdAt, ...sinFecha } = timer(NEW_ID)
        await assertFails(write(sinFecha))
    })

    it('rechaza un FSid distinto del id del documento', async () => {
        await assertFails(write(timer('ana-otro')))
    })

    it('rechaza un título vacío, de 41 caracteres o que no es texto', async () => {
        await assertFails(write(timer(NEW_ID, { title: '' })))
        await assertFails(write(timer(NEW_ID, { title: 't'.repeat(41) })))
        await assertFails(write(timer(NEW_ID, { title: 7 })))
    })

    it('rechaza progresive que no es booleano y fechas que no son timestamp', async () => {
        await assertFails(write(timer(NEW_ID, { progresive: 'yes' })))
        await assertFails(write(timer(NEW_ID, { updateAt: 'hoy' })))
    })

    it('rechaza 0 o 13 jugadores, o players que no es lista', async () => {
        await assertFails(write(timer(NEW_ID, { players: [] })))
        await assertFails(write(timer(NEW_ID, { players: Array.from({ length: 13 }, () => player()) })))
        await assertFails(write(timer(NEW_ID, { players: { a: player() } })))
    })

    it('rechaza un jugador con nombre vacío o de 21 caracteres', async () => {
        await assertFails(write(timer(NEW_ID, { players: [player({ name: '' })] })))
        await assertFails(write(timer(NEW_ID, { players: [player(), player({ name: 'n'.repeat(21) })] })))
        await assertFails(write(timer(NEW_ID, { players: [player({ name: 7 })] })))
    })

    it('rechaza un color que no es #rrggbb', async () => {
        await assertFails(write(timer(NEW_ID, { players: [player({ color: 'red' })] })))
        await assertFails(write(timer(NEW_ID, { players: [player({ color: '#abc' })] })))
        await assertFails(write(timer(NEW_ID, { players: [player({ color: 0xa1b2c3 })] })))
    })

    it('rechaza tiempos fuera de rango o que no son números', async () => {
        await assertFails(write(timer(NEW_ID, { players: [player({ timeValue: 5 })] })))
        await assertFails(write(timer(NEW_ID, { players: [player({ timeValue: 121 })] })))
        await assertFails(write(timer(NEW_ID, { players: [player({ timeValue: '25' })] })))
        await assertFails(write(timer(NEW_ID, { players: [player({ currentTime: -1 })] })))
        await assertFails(write(timer(NEW_ID, { players: [player({ currentTime: 121 })] })))
    })

    it('rechaza un jugador con un campo extra o sin un campo', async () => {
        await assertFails(write(timer(NEW_ID, { players: [player({ admin: true })] })))
        const { color, ...sinColor } = player()
        await assertFails(write(timer(NEW_ID, { players: [player(), sinColor] })))
    })

    it('rechaza un jugador inválido en la última posición de 12', async () => {
        const players = Array.from({ length: 12 }, () => player())
        players[11] = player({ color: 'blue' })
        await assertFails(write(timer(NEW_ID, { players })))
    })

    it('rechaza una actualización parcial que deja el timer inválido', async () => {
        await assertFails(updateDoc(doc(asAna(), 'Timers', 'ana-a1B2c'), { title: '' }))
        await assertFails(updateDoc(doc(asAna(), 'Timers', 'ana-a1B2c'), { players: [] }))
    })
})

describe('Otras colecciones', () => {
    it('quedan negadas aunque haya sesión', async () => {
        const db = asAna()
        await assertFails(getDoc(doc(db, 'Otra', 'ana')))
        await assertFails(setDoc(doc(db, 'Otra', 'ana'), { a: 1 }))
    })
})
