import { describe, it, expect } from 'vitest'
import { authErrorMessage, GENERIC_AUTH_ERROR } from '~/utils/authErrors'

describe('authErrorMessage', () => {
    it.each([
        ['auth/invalid-credential', 'Wrong email or password.'],
        ['auth/wrong-password', 'Wrong email or password.'],
        ['auth/user-not-found', 'Wrong email or password.'],
        ['auth/email-already-in-use', 'That email already has an account.'],
        ['auth/invalid-email', 'Enter a valid email.'],
        ['auth/weak-password', 'Password must be at least 6 characters.'],
        ['auth/too-many-requests', 'Too many attempts. Try again later.'],
        ['auth/network-request-failed', 'No connection. Try again.']
    ])('%s → %s', (code, message) => {
        expect(authErrorMessage({ code, message: `Firebase: Error (${code}).` })).toBe(message)
    })

    it('un código desconocido o un error sin código da el mensaje genérico', () => {
        expect(authErrorMessage({ code: 'auth/otra-cosa' })).toBe(GENERIC_AUTH_ERROR)
        expect(authErrorMessage(new Error('x'))).toBe(GENERIC_AUTH_ERROR)
        expect(authErrorMessage(undefined)).toBe(GENERIC_AUTH_ERROR)
    })
})
