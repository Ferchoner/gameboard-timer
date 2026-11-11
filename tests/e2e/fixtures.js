import { test as base, expect } from '@playwright/test'

// Errores de consola que no vienen de la app: recursos que no cargan (favicons de la futura
// spec 04, Firebase sin red). Cualquier otro error de consola o excepción hace fallar la prueba.
const IGNORED_CONSOLE = [/^Failed to load resource/]

export const test = base.extend({
    page: async ({ page }, use) => {
        const errors = []
        // No enviar visitas de las pruebas a Google Analytics
        await page.route(/google-analytics\.com|googletagmanager\.com/, route => route.abort())
        page.on('pageerror', error => errors.push(`pageerror: ${error.message}`))
        page.on('console', message => {
            if (message.type() !== 'error') return
            if (IGNORED_CONSOLE.some(pattern => pattern.test(message.text()))) return
            errors.push(`console: ${message.text()}`)
        })
        await use(page)
        expect(errors, 'Errores de la app en consola').toEqual([])
    }
})

export { expect }

// Abre una ruta de la app y espera a que termine de comprobar la sesión (invitado)
export async function openApp(page, path = '') {
    await page.goto(path)
    await expect(page.locator('.loading-container')).toHaveCount(0, { timeout: 15000 })
}

// Lista de timers lista para usarse como invitado
export async function openTimers(page) {
    await openApp(page, '')
    await expect(page.locator('.login-buttons')).toBeVisible()
}

// Crea un timer como invitado y devuelve su fila
export async function createTimer(page) {
    const rows = page.locator('.timer-page strong')
    const before = await rows.count()
    await page.locator('.timer-page .action-buttons .btn-success').first().click()
    await expect(rows).toHaveCount(before + 1)
    return before
}

// Abre el modal de edición del timer en la posición index
export async function openEditor(page, index) {
    await page.locator('.timer-page .btn-sm.btn-primary').nth(index).click()
    await expect(page.locator('#timer-form-backdrop')).toBeVisible()
}

export async function saveEditor(page) {
    await page.locator('.timer-modal .modal-footer .btn-primary').click()
}
