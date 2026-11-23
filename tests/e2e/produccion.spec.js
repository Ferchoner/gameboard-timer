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

    test('no pide nada a Google Fonts ni a Analytics y usa las fuentes locales (SPEC 10)', async ({ page }) => {
        const external = []
        page.on('request', req => {
            if (/fonts\.googleapis\.com|fonts\.gstatic\.com|googletagmanager\.com|google-analytics\.com/.test(req.url())) {
                external.push(req.url())
            }
        })
        await openApp(page, '')
        await page.evaluate(() => document.fonts.ready)
        const loaded = await page.evaluate(() => [...document.fonts]
            .filter(font => font.status === 'loaded').map(font => font.family.replace(/["']/g, '')))
        expect(loaded).toContain('Handjet')
        expect(external).toEqual([])
    })

    test('si Firebase no responde, el loading avisa y ofrece recargar', async ({ page }) => {
        // Hay una sesión guardada y Google nunca contesta: Auth no termina de comprobarla.
        // (Colgar IndexedDB ya no sirve: desde firebase 13.4 Auth corta a los pocos segundos
        // y sigue sin sesión guardada, así que el loading se cerraba antes de los 15 s.)
        await page.addInitScript(() => {
            // Mismo formato y clave que guarda Firebase Auth (clave = apiKey de plugins/firebase.client.ts)
            localStorage.setItem('firebase:authUser:AIzaSyACYdTWhjXpt6JQwQvl--jL9xEwYlUuCnQ:[DEFAULT]', JSON.stringify({
                uid: 'usuarioDePrueba',
                email: 'ana@example.com',
                emailVerified: false,
                isAnonymous: false,
                providerData: [],
                stsTokenManager: { refreshToken: 'refresh', accessToken: 'token', expirationTime: Date.now() + 3600000 }
            }))
        })
        // Las peticiones a Auth y Firestore se quedan colgadas, sin respuesta ni error
        await page.route(/identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com|firestore\.googleapis\.com/, () => {})
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
