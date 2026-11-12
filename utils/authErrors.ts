// Mensajes de error de Firebase Auth para el usuario, en inglés como el resto de la interfaz.
// Recibe el error de Firebase (o cualquier objeto con `code`).
const MESSAGES: Record<string, string> = {
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/invalid-login-credentials': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'Wrong email or password.',
    'auth/email-already-in-use': 'That email already has an account.',
    'auth/invalid-email': 'Enter a valid email.',
    'auth/missing-email': 'Enter a valid email.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/missing-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/network-request-failed': 'No connection. Try again.'
}

export const GENERIC_AUTH_ERROR = 'Something went wrong. Try again.'
export const MIN_PASSWORD_LENGTH = 6

export function authErrorMessage(error?: { code?: string } | null): string {
    return MESSAGES[error?.code as string] || GENERIC_AUTH_ERROR
}
