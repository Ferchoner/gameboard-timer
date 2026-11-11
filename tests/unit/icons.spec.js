import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it, expect } from 'vitest'
import { ICON_NAMES } from '../../scripts/update-icon-font.mjs'

// Busca el nombre de cada icono (<span class="material-symbols-outlined">nombre</span>) en los .vue
function vueFiles(dir) {
    return readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
        entry.isDirectory() ? vueFiles(join(dir, entry.name))
            : entry.name.endsWith('.vue') ? [join(dir, entry.name)] : [])
}

function usedIcons() {
    const icons = new Set()
    for (const file of [...vueFiles('components'), 'app.vue']) {
        const source = readFileSync(file, 'utf8')
        for (const match of source.matchAll(/material-symbols-outlined[\s\S]*?>\s*([a-z0-9_]+)\s*<\//g)) {
            icons.add(match[1])
        }
    }
    return [...icons].sort()
}

describe('Iconos de Material Symbols', () => {
    it('todo icono usado en la app está en el subconjunto de la fuente', () => {
        const used = usedIcons()
        expect(used.length).toBeGreaterThan(5)
        const missing = used.filter(icon => !ICON_NAMES.includes(icon))
        expect(missing, 'Agregar a ICON_NAMES y correr node scripts/update-icon-font.mjs').toEqual([])
    })
})
