import { test, expect, openTimers, createTimer, openEditor, saveEditor } from './fixtures'

// Simulaciones del navegador: Wake Lock, visibilidad de la página y audio
async function mockBrowser(page) {
    await page.addInitScript(() => {
        window.__wakeLock = { requested: 0, released: 0 }
        Object.defineProperty(navigator, 'wakeLock', {
            configurable: true,
            value: {
                request: async () => {
                    window.__wakeLock.requested++
                    const sentinel = new EventTarget()
                    sentinel.release = async () => {
                        window.__wakeLock.released++
                        sentinel.dispatchEvent(new Event('release'))
                    }
                    return sentinel
                }
            }
        })
        window.__visibility = 'visible'
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => window.__visibility })
        window.__alarms = 0
        HTMLMediaElement.prototype.play = function () {
            window.__alarms++
            return Promise.resolve()
        }
    })
}

const setVisibility = (page, state) => page.evaluate(value => {
    window.__visibility = value
    document.dispatchEvent(new Event('visibilitychange'))
}, state)

const countdowns = page => page.locator('.timer-countdown')

// Crea un timer de 10 minutos y abre su pantalla
async function startTimerApp(page, { players = 2, continuous = false } = {}) {
    await openTimers(page)
    await createTimer(page)
    await openEditor(page, 0)
    for (let i = 2; i < players; i++) await page.locator('#basic-addon-plus').click()
    await page.locator('#timer-player-time').fill('10')
    if (continuous) await page.locator('#progresive').check()
    await saveEditor(page)
    await expect(page.locator('#timer-form-backdrop')).toBeHidden()
    await page.locator('.timer-page .btn-success.me-2').first().click()
    await expect(countdowns(page)).toHaveCount(players)
    await expect(countdowns(page).first()).toHaveText('10 : 00')
}

test.describe('Reloj (invitado)', () => {
    test.beforeEach(async ({ page }) => {
        await mockBrowser(page)
        await page.clock.install()
    })

    test('modo normal: descuenta el tiempo real y se detiene al pausar', async ({ page }) => {
        await startTimerApp(page)
        await page.locator('.player-container .btn-primary').first().click()
        await page.clock.fastForward('01:00')
        await expect(countdowns(page)).toHaveText([/^(9 : 00|8 : 59)$/, '10 : 00'])

        await page.locator('.player-container .btn-secondary').first().click()
        const paused = await countdowns(page).first().textContent()
        await page.clock.fastForward('01:00')
        await expect(countdowns(page).first()).toHaveText(paused)
    })

    test('modo normal: al llegar a 0 el botón vuelve a play y suena la alarma', async ({ page }) => {
        await startTimerApp(page)
        await page.locator('.player-container .btn-primary').nth(1).click()
        await page.clock.fastForward('10:05')
        await expect(countdowns(page).nth(1)).toHaveText('0 : 00')
        await expect(page.locator('.player-container').nth(1).locator('button').first()).toContainText('play_circle')
        expect(await page.evaluate(() => window.__alarms)).toBe(1)
    })

    test('Continuous: "siguiente" y play se saltan a los jugadores en 0', async ({ page }) => {
        await startTimerApp(page, { players: 3, continuous: true })
        const [main, pause, resetAll] = [0, 1, 2].map(i => page.locator('.controls button').nth(i))

        await main.click() // arranca el jugador 1
        await page.clock.fastForward('00:10')
        await main.click() // siguiente: jugador 2
        await page.clock.fastForward('10:05') // se le acaba el tiempo
        await expect(countdowns(page).nth(1)).toHaveText('0 : 00')
        await expect(main).toContainText('play_circle')

        await main.click() // play: salta al jugador 3
        await page.clock.fastForward('00:10')
        await expect(countdowns(page).nth(2)).not.toHaveText('10 : 00')

        const firstBefore = await countdowns(page).first().textContent()
        await main.click() // siguiente: salta al jugador 2 (en 0) y vuelve al 1
        await page.clock.fastForward('00:10')
        await expect(countdowns(page).first()).not.toHaveText(firstBefore)

        await pause.click()
        const values = await countdowns(page).allTextContents()
        await page.clock.fastForward('00:30')
        await expect(countdowns(page)).toHaveText(values)
        await expect(main).toContainText('play_circle')

        await resetAll.click()
        await expect(countdowns(page)).toHaveText(['10 : 00', '10 : 00', '10 : 00'])
    })

    test('Continuous: con todos en 0 ningún reloj corre', async ({ page }) => {
        await startTimerApp(page, { players: 2, continuous: true })
        const main = page.locator('.controls button').first()
        for (let i = 0; i < 2; i++) {
            await main.click()
            await page.clock.fastForward('10:05')
        }
        await expect(countdowns(page)).toHaveText(['0 : 00', '0 : 00'])
        await main.click()
        await expect(main).toContainText('play_circle')
    })

    test('la alarma perdida en segundo plano suena una vez al volver', async ({ page }) => {
        await startTimerApp(page)
        await page.locator('.player-container .btn-primary').first().click()
        await setVisibility(page, 'hidden')
        await page.clock.fastForward('10:05')
        expect(await page.evaluate(() => window.__alarms)).toBe(0)

        await setVisibility(page, 'visible')
        await expect(countdowns(page).first()).toHaveText('0 : 00')
        await expect.poll(() => page.evaluate(() => window.__alarms)).toBe(1)
        await setVisibility(page, 'visible')
        expect(await page.evaluate(() => window.__alarms)).toBe(1)
    })

    test('la pantalla se mantiene encendida en el timer y se libera al salir', async ({ page }) => {
        await startTimerApp(page)
        await expect.poll(() => page.evaluate(() => window.__wakeLock.requested)).toBe(1)
        await page.locator('.light-header button').first().click()
        await expect(page.locator('.timer-page h6')).toHaveText('Timers')
        expect(await page.evaluate(() => window.__wakeLock.released)).toBe(1)
    })
})
