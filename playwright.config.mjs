import { defineConfig, devices } from '@playwright/test'

// E2E contra el build de producción (NITRO_PRESET=github-pages npm run build).
// PW_CHROMIUM_PATH permite usar un Chromium ya instalado en vez del de Playwright.
const launchOptions = process.env.PW_CHROMIUM_PATH ? { executablePath: process.env.PW_CHROMIUM_PATH } : {}

export default defineConfig({
    testDir: 'tests/e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: 0,
    reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: {
        baseURL: 'http://localhost:4173/gameboard-timer/',
        trace: 'off',
        launchOptions
    },
    projects: [
        { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], launchOptions } },
        { name: 'mobile-chromium', use: { ...devices['Pixel 7'], launchOptions } }
    ],
    webServer: {
        command: 'node tests/e2e/serve.mjs',
        url: 'http://localhost:4173/gameboard-timer/',
        reuseExistingServer: !process.env.CI
    }
})
