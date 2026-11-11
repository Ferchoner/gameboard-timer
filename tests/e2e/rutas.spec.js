import { test, expect, openApp } from './fixtures'

test.describe('Rutas bajo /gameboard-timer/', () => {
    test('la lista carga y recargar /timers funciona', async ({ page }) => {
        await openApp(page, '')
        await expect(page.locator('.timer-page h6')).toHaveText('Timers')
        await openApp(page, 'timers')
        await expect(page.locator('.timer-page h6')).toHaveText('Timers')
    })

    test('el formulario de registro carga al recargar', async ({ page }) => {
        await openApp(page, 'user/signup-form')
        await expect(page.locator('.user-register-page form')).toBeVisible()
    })

    for (const path of ['timer-app/0', 'timer-app/abc']) {
        test(`/${path} sin timer muestra "Timer not found" y vuelve a la lista`, async ({ page }) => {
            await openApp(page, path)
            await expect(page.locator('.timer-not-found h2')).toHaveText('Timer not found')
            await page.locator('.timer-not-found a').click()
            await expect(page).toHaveURL(/\/gameboard-timer\/$/)
            await expect(page.locator('.timer-page h6')).toHaveText('Timers')
        })
    }
})
