// Nombre y color al azar para un jugador nuevo (SPEC 10). Reemplaza a faker, que ocupaba unos
// 153 KB gzip del JavaScript de entrada solo para esto.

// Nombres comunes en inglés, como los que daba faker; todos de 20 caracteres o menos (MAX_NAME_LENGTH)
export const PLAYER_NAMES: readonly string[] = [
    'Alice', 'Ben', 'Chloe', 'Daniel', 'Emma', 'Felix', 'Grace', 'Henry',
    'Isla', 'Jack', 'Kate', 'Leo', 'Mia', 'Noah', 'Olivia', 'Peter',
    'Quinn', 'Ruby', 'Sam', 'Tara', 'Uma', 'Victor', 'Wendy', 'Xavier',
    'Yara', 'Zack', 'Amelia', 'Caleb', 'Daisy', 'Ethan', 'Fiona', 'George',
    'Hannah', 'Isaac', 'Julia', 'Liam', 'Nora', 'Oscar', 'Sophie', 'Tom'
]

// Entero al azar en [0, max) con crypto.getRandomValues
function randomInt(max: number): number {
    const value = crypto.getRandomValues(new Uint32Array(1))[0]!
    return value % max
}

export function randomName(): string {
    return PLAYER_NAMES[randomInt(PLAYER_NAMES.length)]!
}

// Color '#rrggbb' en minúsculas, el formato que exige firestore.rules (SPEC 09)
export function randomColor(): string {
    const bytes = crypto.getRandomValues(new Uint8Array(3))
    return '#' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}
