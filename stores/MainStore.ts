import { defineStore } from 'pinia';

export const useMainStore = defineStore( 'MainStore', {
    state: () => {
        return {
            isFirestoreReady: false,
            isFirebaseAuthReady: false,
            saveError: false // muestra el aviso "Couldn't save changes"
        }
    },
    actions: {
        checkFirebaseAuth(): boolean {
            const { isReady } = useFirebaseAuth(); // auto-imported
            this.isFirebaseAuthReady = isReady();
            return this.isFirebaseAuthReady;
        },
        checkFirestore(): boolean {
            const { isReady } = useFirestore(); // auto-imported
            this.isFirestoreReady = isReady();
            return this.isFirestoreReady;
        },
        reportSaveError() {
            this.saveError = true;
        },
        dismissSaveError() {
            this.saveError = false;
        }
    }
})

// Envuelve una escritura a Firestore: si falla, avisa en la app en lugar de perder el error.
// Devuelve null si falló; nunca lanza.
export async function guardWrite<T>(write: Promise<T>): Promise<T | null> {
    try {
        return await write;
    } catch (error) {
        console.warn('Firestore write failed', error);
        useMainStore().reportSaveError();
        return null;
    }
}
