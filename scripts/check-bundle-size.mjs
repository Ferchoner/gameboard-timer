// Chequeo de tamaño del JavaScript de entrada (SPEC 08).
// Lee el chunk de entrada desde el importmap de .output/public/index.html, lo comprime con gzip
// y falla si pasa del límite. Antes: NITRO_PRESET=github-pages npm run build.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

// Límite en KB gzip: lo medido tras la SPEC 10 (208,1 KB) más un 10 %, redondeado hacia arriba.
// Antes de la SPEC 10 era 420 KB (con faker, Bootstrap JS completo y Analytics).
const LIMIT_KB = 229

const publicDir = join(process.cwd(), '.output', 'public')
const html = readFileSync(join(publicDir, 'index.html'), 'utf8')
const match = html.match(/"#entry"\s*:\s*"([^"]+)"/)
if (!match) {
    console.error('No se encontró el chunk de entrada (#entry) en el importmap de index.html.')
    process.exit(1)
}

// La ruta lleva el baseURL (/gameboard-timer/_nuxt/...); en disco empieza en _nuxt/
const entryPath = match[1].replace(/^.*?\/_nuxt\//, '_nuxt/')
const source = readFileSync(join(publicDir, entryPath))
const gzipKb = gzipSync(source).length / 1024
const rawKb = source.length / 1024

console.log(`Chunk de entrada ${entryPath}: ${rawKb.toFixed(0)} KB, ${gzipKb.toFixed(1)} KB gzip (límite ${LIMIT_KB} KB gzip)`)
if (gzipKb > LIMIT_KB) {
    console.error(`El JavaScript de entrada pasa del límite por ${(gzipKb - LIMIT_KB).toFixed(1)} KB gzip.`)
    process.exit(1)
}
