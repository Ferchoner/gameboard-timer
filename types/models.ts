// Documentos de Firestore tal como están guardados (docs/02_diseno/FUNCIONALIDAD_ACTUAL.md).
// Solo tipos: no validan nada en tiempo de ejecución (SPEC 07).
import type { DocumentReference, Timestamp } from 'firebase/firestore'

// Timers/{FSid}.players[]
export interface PlayerData {
    name: string
    color: string        // hex, por ejemplo '#a1b2c3'
    timeValue: number    // minutos
    currentTime: number  // minutos
}

// Timers/{FSid}
export interface TimerData {
    FSid: string         // `${uid}-${5 caracteres}`; '' para invitado
    progresive: boolean  // modo Continuous
    title: string
    players: PlayerData[]
    createdAt: Date | Timestamp  // Date al crearlo; Timestamp al leerlo de Firestore
    updateAt: Date | Timestamp
}

// Users/{uid}
export interface UserData {
    email: string
    username: string
    firstName: string
    lastName: string
    uid: string
    guest: boolean
    timers: DocumentReference[]
}
