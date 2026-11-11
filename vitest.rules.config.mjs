import { defineConfig } from 'vitest/config'

// Pruebas de firestore.rules contra el emulador de Firestore.
// Se corren con `npm run test:rules`, que arranca el emulador (necesita Java 21+).
export default defineConfig({
    test: {
        environment: 'node',
        include: ['tests/rules/**/*.spec.js'],
        testTimeout: 20000,
        hookTimeout: 60000
    }
})
