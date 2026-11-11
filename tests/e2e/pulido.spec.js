import { test, expect, openApp, openTimers, createTimer, openEditor, saveEditor } from './fixtures'

test.describe('Iconos desde el propio sitio', () => {
    test('Material Symbols carga sin pedir nada a Google y se ve como icono', async ({ page }) => {
        const googleIcons = []
        page.on('request', request => {
            if (/Material\+Symbols|fonts\.gstatic\.com\/.*materialsymbols/i.test(request.url())) {
                googleIcons.push(request.url())
            }
        })
        await openTimers(page)
        await page.evaluate(() => document.fonts.ready)
        expect(await page.evaluate(() => document.fonts.check('24px "Material Symbols Outlined"', 'add_circle'))).toBe(true)
        // Como icono mide lo mismo que su tamaño de letra; como texto "add_circle" mediría ~5 veces más
        const box = await page.getByRole('button', { name: 'New timer' }).locator('span').boundingBox()
        expect(box.width).toBeLessThan(30)
        expect(googleIcons).toEqual([])
    })
})

test.describe('Nombre accesible y etiquetas', () => {
    test('los botones de la lista se encuentran por su nombre', async ({ page }) => {
        await openTimers(page)
        await page.getByRole('button', { name: 'New timer' }).click()
        await expect(page.getByRole('button', { name: 'Play New Timer' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Edit New Timer' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Delete New Timer' })).toBeVisible()
    })

    test('cada etiqueta del editor apunta a su campo', async ({ page }) => {
        await openTimers(page)
        await createTimer(page)
        await openEditor(page, 0)
        const editor = page.locator('#timer-form-backdrop')
        await editor.getByLabel('Timer Title').fill('Catan')
        await expect(editor.locator('input.timer-title')).toHaveValue('Catan')
        await expect(editor.getByLabel('Player name')).toHaveCount(2)
        await expect(editor.getByLabel('Color')).toHaveCount(2)
        await expect(editor.getByRole('group', { name: 'Players (Timer buttons)' })).toBeVisible()
    })

    test('cada etiqueta del registro y del login apunta a su campo', async ({ page }) => {
        await openApp(page, 'user/signup-form')
        const register = page.locator('.user-register-page')
        for (const label of ['First Name', 'Last Name', 'Email address', 'Password']) {
            await expect(register.getByLabel(label, { exact: true })).toHaveCount(1)
        }
        const login = page.locator('#login-backdrop')
        await expect(login.getByLabel('Email address')).toHaveAttribute('type', 'email')
        await expect(login.getByLabel('Password')).toHaveAttribute('type', 'password')
    })
})

test.describe('Nombres largos', () => {
    test('el editor limita el nombre a 20 caracteres', async ({ page }) => {
        await openTimers(page)
        await createTimer(page)
        await openEditor(page, 0)
        const name = page.locator('#timer-player-name-0')
        await name.fill('')
        await name.pressSequentially('A'.repeat(30))
        await expect(name).toHaveValue('A'.repeat(20))
    })

    test('con 12 jugadores de nombre largo, ningún nombre se sale de su tarjeta', async ({ page }) => {
        await openTimers(page)
        await createTimer(page)
        await openEditor(page, 0)
        for (let i = 2; i < 12; i++) await page.locator('#basic-addon-plus').click()
        for (let i = 0; i < 12; i++) await page.locator(`#timer-player-name-${i}`).fill('W'.repeat(20))
        await saveEditor(page)
        await expect(page.locator('#timer-form-backdrop')).toBeHidden()
        await page.getByRole('button', { name: 'Play New Timer' }).click()
        await expect(page.locator('.player-name')).toHaveCount(12)

        const overflow = await page.locator('.player-container').evaluateAll(containers => containers.map(container => {
            const card = container.querySelector('.card').getBoundingClientRect()
            const name = container.querySelector('.player-name').getBoundingClientRect()
            return name.left >= card.left - 1 && name.right <= card.right + 1
        }))
        expect(overflow).toEqual(Array(12).fill(true))
        // El que no cabe se corta con "…" (en móvil no cabe ninguno)
        const cut = await page.locator('.player-name').evaluateAll(names => names.map(name => {
            const style = getComputedStyle(name)
            return name.scrollWidth <= name.clientWidth || (style.textOverflow === 'ellipsis' && style.overflow === 'hidden')
        }))
        expect(cut).toEqual(Array(12).fill(true))
        const pageWidth = await page.evaluate(() => [document.documentElement.scrollWidth, window.innerWidth])
        expect(pageWidth[0]).toBeLessThanOrEqual(pageWidth[1])
    })
})

test.describe('Aviso al invitado', () => {
    const notice = page => page.getByRole('status').filter({ hasText: 'Guest mode' })

    test('sin timers no hay aviso ni confirmación al salir', async ({ page }) => {
        await openTimers(page)
        await expect(notice(page)).toHaveCount(0)
        let dialogs = 0
        page.on('dialog', dialog => { dialogs++; dialog.accept() })
        await page.reload()
        expect(dialogs).toBe(0)
    })

    test('con timers avisa en la lista y pide confirmar al salir; cancelar no borra nada', async ({ page }) => {
        await openTimers(page)
        await createTimer(page)
        await expect(notice(page)).toContainText('your timers are lost if you reload or close this page')

        const dialog = new Promise(resolve => page.once('dialog', async d => { resolve(d.type()); await d.dismiss() }))
        await page.close({ runBeforeUnload: true })
        expect(await dialog).toBe('beforeunload')
        expect(page.isClosed()).toBe(false)
        await expect(page.locator('.timer-page strong')).toHaveCount(1)
    })
})

