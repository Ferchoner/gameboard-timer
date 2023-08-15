import { initializeApp } from 'firebase/app'
import { getAuth } from "firebase/auth"
import { getFirestore } from 'firebase/firestore'
import { getAnalytics } from "firebase/analytics"

export default defineNuxtPlugin(nuxtApp => {
    const config = useRuntimeConfig()

    const firebaseConfig = {
        apiKey: "AIzaSyACYdTWhjXpt6JQwQvl--jL9xEwYlUuCnQ",
        authDomain: "timer-42311.firebaseapp.com",
        projectId: "timer-42311",
        storageBucket: "timer-42311.appspot.com",
        messagingSenderId: "1091987342786",
        appId: "1:1091987342786:web:f01dd28f7671367f17025b",
        measurementId: "G-VVH6EPQPHG"
    };

    const app = initializeApp(firebaseConfig)

    const analytics = getAnalytics(app)
    const auth = getAuth(app)
    const firestore = getFirestore(app)

    nuxtApp.vueApp.provide('auth', auth)
    nuxtApp.provide('auth', auth)

    nuxtApp.vueApp.provide('firestore', firestore)
    nuxtApp.provide('firestore', firestore)
})