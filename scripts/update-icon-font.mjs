// Descarga de Google Fonts el subconjunto de Material Symbols Outlined con los iconos que usa la app
// y lo guarda en assets/fonts/ (SPEC 06). Correr al agregar un icono:
//   node scripts/update-icon-font.mjs
// La variante es la misma que se cargaba desde Google Fonts: opsz 48, wght 400, FILL 0, GRAD 0.
import { writeFile } from 'node:fs/promises'

export const ICON_NAMES = [
    'add',
    'add_circle',
    'cancel',
    'delete',
    'edit',
    'home',
    'pause_circle',
    'play_circle',
    'remove',
    'skip_next',
    'stop_circle'
]

const OUTPUT = new URL('../assets/fonts/material-symbols-outlined.woff2', import.meta.url)
// Google Fonts entrega woff2 solo a navegadores que lo anuncian
const USER_AGENT = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'

async function main() {
    // icon_names exige los nombres en orden alfabético
    const names = [...ICON_NAMES].sort().join(',')
    const cssUrl = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0&icon_names=${names}&display=block`
    const css = await (await fetch(cssUrl, { headers: { 'User-Agent': USER_AGENT } })).text()
    const fontUrl = css.match(/src:\s*url\(([^)]+)\)\s*format\('woff2'\)/)?.[1]
    if (!fontUrl) throw new Error(`No se encontró la fuente woff2 en la respuesta de Google Fonts:\n${css}`)
    const font = Buffer.from(await (await fetch(fontUrl)).arrayBuffer())
    await writeFile(OUTPUT, font)
    console.log(`Guardado ${OUTPUT.pathname} (${font.length} bytes, ${ICON_NAMES.length} iconos)`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
    await main()
}
