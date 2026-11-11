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
