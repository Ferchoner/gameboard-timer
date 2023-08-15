import { defineStore } from 'pinia';

export const useMainStore = defineStore( 'MainStore', {
    state: () => {
        return {
            isFirestoreReady: false,
            isFirebaseAuthReady: false
        }
    },
    actions: {
        async checkFirebaseAuth() {
            const { isReady } = useFirebaseAuth(); // auto-imported
            this.isFirebaseAuthReady = isReady();
            return this.isFirebaseAuthReady;
        },
        async checkFirestore() {
            const { isReady } = useFirestore(); // auto-imported
            this.isFirestoreReady = isReady();
            return this.isFirestoreReady;
        }
    }
})