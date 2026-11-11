// Servidor estático mínimo que imita GitHub Pages para las pruebas E2E:
// sirve .output/public bajo /gameboard-timer/ y responde 404.html a lo que no existe.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('../../.output/public/', import.meta.url))
const BASE = '/gameboard-timer/'
const PORT = Number(process.env.PORT) || 4173

const TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.xml': 'application/xml',
    '.webmanifest': 'application/manifest+json',
    '.txt': 'text/plain; charset=utf-8'
}

async function findFile(urlPath) {
    if (!urlPath.startsWith(BASE)) return null
    const relative = normalize(decodeURIComponent(urlPath.slice(BASE.length))).replace(/^(\.\.[/\\])+/, '')
    const candidates = [join(ROOT, relative), join(ROOT, relative, 'index.html')]
    for (const candidate of candidates) {
        try {
            if ((await stat(candidate)).isFile()) return candidate
        } catch {
            // no existe; probar el siguiente
        }
    }
    return null
}

createServer(async (req, res) => {
    const urlPath = new URL(req.url, 'http://localhost').pathname
    const file = await findFile(urlPath)
    try {
        if (file) {
            res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
            res.end(await readFile(file))
        } else {
            res.writeHead(404, { 'Content-Type': TYPES['.html'] })
            res.end(await readFile(join(ROOT, '404.html')))
        }
    } catch (error) {
        res.writeHead(500, { 'Content-Type': 'text/plain' })
        res.end(String(error))
    }
}).listen(PORT, () => {
    console.log(`E2E: sirviendo .output/public en http://localhost:${PORT}${BASE}`)
})
