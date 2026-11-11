import { test, expect, openApp } from './fixtures'

test.describe('Producción bajo /gameboard-timer/', () => {
    test('favicons, manifest y sus iconos responden 200', async ({ page, request }) => {
        await openApp(page, '')
        const hrefs = await page.locator('head link[rel~="icon"], head link[rel="apple-touch-icon"], head link[rel="manifest"], head link[rel="mask-icon"]')
            .evaluateAll(links => links.map(link => link.href))
        expect(hrefs).toHaveLength(5)
        for (const href of hrefs) {
            expect(new URL(href).pathname, href).toMatch(/^\/gameboard-timer\//)
            expect((await request.get(href)).status(), href).toBe(200)
        }

        const manifestUrl = hrefs.find(href => href.endsWith('site.webmanifest'))
        const manifest = await (await request.get(manifestUrl)).json()
        expect(manifest.icons.length).toBeGreaterThan(0)
        for (const icon of manifest.icons) {
            const iconUrl = new URL(icon.src, manifestUrl).href
            expect((await request.get(iconUrl)).status(), iconUrl).toBe(200)
        }
    })

    test('si Firebase no responde, el loading avisa y ofrece recargar', async ({ page }) => {
        // Auth no termina de arrancar si IndexedDB nunca responde: la sesión queda sin comprobar
        await page.addInitScript(() => {
            window.indexedDB.open = () => new EventTarget()
        })
        await page.clock.install()
        await page.goto('')
        const loading = page.locator('.loading-container')
        await expect(loading.locator('img.loading-img')).toBeVisible()
        await expect(loading.getByRole('alert')).toHaveCount(0)

        await page.clock.runFor(15000)
        await expect(loading.getByRole('alert')).toContainText("Couldn't connect")
        await expect(loading.getByRole('button', { name: 'Reload' })).toBeVisible()
    })

    test('con Firebase normal, el aviso del loading no aparece', async ({ page }) => {
        await page.clock.install()
        await openApp(page, '')
        await page.clock.runFor(20000)
        await expect(page.locator('.loading-container')).toHaveCount(0)
    })
})
