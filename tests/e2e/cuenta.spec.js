import { test, expect, openApp } from './fixtures'

test.describe('Registro (sin llegar a Firebase)', () => {
    test('una contraseña de menos de 6 caracteres se rechaza antes de llamar a Firebase', async ({ page }) => {
        const authRequests = []
        page.on('request', request => {
            if (/identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com/.test(request.url())) {
                authRequests.push(request.url())
            }
        })
        await openApp(page, 'user/signup-form')
        const form = page.locator('.user-register-page form')
        await form.locator('input.firstname').fill('Ana')
        await form.locator('input.lastname').fill('López')
        await form.locator('input.email').fill('ana@example.com')
        await form.locator('input.password').fill('12345')
        await form.getByRole('button', { name: 'Sign In' }).click()

        await expect(form.locator('.messages.error')).toHaveText('Password must be at least 6 characters.')
        await expect(page).toHaveURL(/\/user\/signup-form$/)
        expect(authRequests).toEqual([])
    })
})

// Respuestas falsas de Firebase Auth: el login "funciona" sin llegar a Google. Firestore se
// corta (queda sin conexión), así que después del login la app se queda comprobando la sesión; aquí solo importa el modal.
function fakeIdToken(uid) {
    const encode = obj => Buffer.from(JSON.stringify(obj)).toString('base64url')
    const now = Math.floor(Date.now() / 1000)
    return `${encode({ alg: 'none', typ: 'JWT' })}.${encode({ user_id: uid, sub: uid, iat: now, exp: now + 3600, auth_time: now, firebase: { sign_in_provider: 'password' } })}.firma`
}

test.describe('Login (Firebase simulado)', () => {
    test('al entrar se cierra el modal de login con la API de Bootstrap', async ({ page }) => {
        const uid = 'usuarioDePrueba'
        const idToken = fakeIdToken(uid)
        await page.route(/identitytoolkit\.googleapis\.com\/v1\/accounts:signInWithPassword/, route => route.fulfill({
            json: { kind: 'identitytoolkit#VerifyPasswordResponse', localId: uid, email: 'ana@example.com', idToken, refreshToken: 'refresh', expiresIn: '3600', registered: true }
        }))
        await page.route(/identitytoolkit\.googleapis\.com\/v1\/accounts:lookup/, route => route.fulfill({
            json: { kind: 'identitytoolkit#GetAccountInfoResponse', users: [{ localId: uid, email: 'ana@example.com', emailVerified: false, passwordHash: 'x', providerUserInfo: [] }] }
        }))
        await page.route(/firestore\.googleapis\.com/, route => route.abort())

        await openApp(page, '')
        await page.locator('.login-buttons').getByRole('button', { name: 'Login' }).click()
        const modal = page.locator('#login-backdrop')
        await expect(modal).toBeVisible()
        await modal.locator('input.email').fill('ana@example.com')
        await modal.locator('input.password').fill('secreto123')
        await modal.getByRole('button', { name: 'Login' }).click()

        await expect(modal).toBeHidden()
        await expect(page.locator('.modal-backdrop')).toHaveCount(0)
    })
})
