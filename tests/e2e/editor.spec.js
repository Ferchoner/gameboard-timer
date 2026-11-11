import { test, expect, openTimers, createTimer, openEditor, saveEditor } from './fixtures'

const names = page => page.locator('.timer-modal .players-container input[type=text]')
const nameValues = page => names(page).evaluateAll(inputs => inputs.map(input => input.value))
const modal = page => page.locator('#timer-form-backdrop')

test.describe('Editor de timers (invitado)', () => {
    test.beforeEach(async ({ page }) => {
        await openTimers(page)
    })

    test('"+" crea un timer con 2 jugadores', async ({ page }) => {
        await createTimer(page)
        await expect(page.locator('.timer-page strong').first()).toHaveText('New Timer (2 players)')
    })

    test('el tiempo elegido se aplica a todos los jugadores y al reiniciar', async ({ page }) => {
        await createTimer(page)
        await openEditor(page, 0)
        await page.locator('#timer-player-time').fill('60')
        await page.locator('#basic-addon-plus').click()
        await saveEditor(page)
        await expect(modal(page)).toBeHidden()

        await page.locator('.timer-page .btn-success.me-2').first().click()
        await expect(page.locator('.timer-countdown')).toHaveText(['60 : 00', '60 : 00', '60 : 00'])
        await page.locator('.player-container .btn-danger').nth(2).click()
        await expect(page.locator('.timer-countdown').nth(2)).toHaveText('60 : 00')
    })

    test('"−" quita al último jugador y conserva el tiempo', async ({ page }) => {
        await createTimer(page)
        await openEditor(page, 0)
        await page.locator('#timer-player-time').fill('60')
        const before = await nameValues(page)
        await page.locator('#basic-addon-plus').click()
        await page.locator('#basic-addon-minus').click()
        await expect(names(page)).toHaveCount(before.length)
        expect(await nameValues(page)).toEqual(before)
        await expect(page.locator('label[for=timer-player-time]')).toHaveText('Players time (60 Minutes)')
    })

    test('los jugadores van de 1 a 12 y el botón del límite se desactiva', async ({ page }) => {
        await createTimer(page)
        await openEditor(page, 0)
        const plus = page.locator('#basic-addon-plus')
        const minus = page.locator('#basic-addon-minus')

        for (let i = 0; i < 10; i++) await plus.click()
        await expect(names(page)).toHaveCount(12)
        await expect(plus).toHaveAttribute('aria-disabled', 'true')
        await plus.click({ force: true })
        await expect(names(page)).toHaveCount(12)

        for (let i = 0; i < 11; i++) await minus.click()
        await expect(names(page)).toHaveCount(1)
        await expect(minus).toHaveAttribute('aria-disabled', 'true')
        await minus.click({ force: true })
        await expect(names(page)).toHaveCount(1)
    })

    test('título o nombre vacío no se guardan, ni con "Update Timer" ni con la X', async ({ page }) => {
        await createTimer(page)
        await openEditor(page, 0)
        const message = page.locator('.timer-modal .messages')

        await page.locator('.timer-modal .timer-title').fill('   ')
        await saveEditor(page)
        await expect(message).toHaveText('Title is required.')
        await page.locator('.timer-modal .btn-close').click()
        await expect(modal(page)).toBeVisible()

        await page.locator('.timer-modal .timer-title').fill('Catan')
        await names(page).nth(1).fill('')
        await saveEditor(page)
        await expect(message).toHaveText('Player 2 needs a name.')
        await expect(modal(page)).toBeVisible()

        await names(page).nth(1).fill('Beto')
        await saveEditor(page)
        await expect(modal(page)).toBeHidden()
        await expect(page.locator('.timer-page strong').first()).toHaveText('Catan (2 players)')
    })

    test('borrar pide confirmación; cancelar no borra', async ({ page }) => {
        await createTimer(page)
        const rows = page.locator('.timer-page strong')

        page.once('dialog', dialog => dialog.dismiss())
        await page.locator('.timer-page .btn-sm.btn-danger').first().click()
        await expect(rows).toHaveCount(1)

        page.once('dialog', dialog => {
            expect(dialog.message()).toBe('Delete "New Timer"?')
            dialog.accept()
        })
        await page.locator('.timer-page .btn-sm.btn-danger').first().click()
        await expect(rows).toHaveCount(0)
    })

    test('editar y borrar el último timer de la lista no rompe la página', async ({ page }) => {
        await createTimer(page)
        await createTimer(page)
        await openEditor(page, 1)
        await page.locator('.timer-modal .timer-title').fill('Azul')
        await saveEditor(page)
        await expect(modal(page)).toBeHidden()

        page.once('dialog', dialog => dialog.accept())
        await page.locator('.timer-page .btn-sm.btn-danger').nth(1).click()
        await expect(page.locator('.timer-page strong')).toHaveCount(1)

        await openEditor(page, 0)
        await expect(page.locator('.timer-modal .modal-title')).toHaveText('New Timer')
    })
})
