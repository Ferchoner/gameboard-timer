import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, updateDoc, arrayUnion, deleteField } from 'firebase/firestore'

let env

const timer = (FSid) => ({
    FSid,
    title: 'New Timer',
    progresive: false,
    createdAt: new Date(),
    updateAt: new Date(),
    players: [{ name: 'Ana', color: '#a1b2c3', timeValue: 25, currentTime: 25 }]
})

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
        await setDoc(doc(db, 'Users', 'ana'), { email: 'ana@example.com', uid: 'ana', timers: [] })
        await setDoc(doc(db, 'Users', 'beto'), { email: 'beto@example.com', uid: 'beto', timers: [] })
        await setDoc(doc(db, 'Timers', 'ana-a1B2c'), timer('ana-a1B2c'))
        await setDoc(doc(db, 'Timers', 'beto-a1B2c'), timer('beto-a1B2c'))
    })
})

const asAna = () => env.authenticatedContext('ana').firestore()
const asGuest = () => env.unauthenticatedContext().firestore()

describe('Users', () => {
    it('Ana lee, crea y actualiza su propio documento', async () => {
        const db = asAna()
        await assertSucceeds(getDoc(doc(db, 'Users', 'ana')))
        await assertSucceeds(setDoc(doc(db, 'Users', 'ana'), { email: 'ana@example.com', uid: 'ana', timers: [] }))
        await assertSucceeds(updateDoc(doc(db, 'Users', 'ana'), {
            timers: arrayUnion(doc(db, 'Timers', 'ana-a1B2c')),
            accessToken: deleteField()
        }))
    })

    it('Ana no puede leer, cambiar ni borrar el documento de Beto', async () => {
        const db = asAna()
        await assertFails(getDoc(doc(db, 'Users', 'beto')))
        await assertFails(updateDoc(doc(db, 'Users', 'beto'), { timers: [] }))
        await assertFails(setDoc(doc(db, 'Users', 'beto'), { email: 'x' }))
        await assertFails(deleteDoc(doc(db, 'Users', 'beto')))
    })

    it('sin sesión no se puede leer ni escribir ningún usuario', async () => {
        const db = asGuest()
        await assertFails(getDoc(doc(db, 'Users', 'ana')))
        await assertFails(setDoc(doc(db, 'Users', 'nadie'), { email: 'x' }))
    })
})

describe('Timers', () => {
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

describe('Otras colecciones', () => {
    it('quedan negadas aunque haya sesión', async () => {
        const db = asAna()
        await assertFails(getDoc(doc(db, 'Otra', 'ana')))
        await assertFails(setDoc(doc(db, 'Otra', 'ana'), { a: 1 }))
    })
})
