import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

const root = fileURLToPath(new URL('./', import.meta.url))

// Vitest "puro", sin @nuxt/test-utils: solo pruebas unitarias de lógica (stores y composables).
export default defineConfig({
    resolve: {
        alias: {
            '~': root,
            '@': root
        }
    },
    test: {
        environment: 'node',
        include: ['tests/unit/**/*.spec.js']
    }
})
