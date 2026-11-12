// Tipos de lo que provee plugins/firebase.client.ts (nuxtApp.provide no los infiere) y de
// Bootstrap, que no trae declaraciones para su bundle (SPEC 07).
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

// Lo que la app usa de Bootstrap (plugins/useBootstrap.client.ts)
type BootstrapBundle = {
    Modal: { getOrCreateInstance(element: Element): { hide(): void } }
}

declare module '#app' {
    interface NuxtApp {
        $auth: Auth
        $firestore: Firestore
        $bootstrap: BootstrapBundle
    }
}

declare module 'vue' {
    interface ComponentCustomProperties {
        $auth: Auth
        $firestore: Firestore
        $bootstrap: BootstrapBundle
    }
}

export {}
