// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    app: {
        head: {
            title: 'Timer for Friends | Inicio',
            meta: [
                { charset: 'utf-8'},
                { name: 'viewport', content: 'width=device-width, initial-scale=1'},
                { name: 'description', content: 'Gameboard timers'},
                { name: 'msapplication-TileColor', content: '#ffffff'},
                { name: 'theme-color', content: '#ffffff'}
            ],
            // Los archivos de public/ se sirven bajo baseURL, y head.link no le agrega el prefijo:
            // sin /gameboard-timer/ dan 404 en GitHub Pages.
            link: [
                {rel: 'apple-touch-icon', sizes: '180x180', href: '/gameboard-timer/apple-touch-icon.png'},
                {rel: 'icon', sizes: '32x32', href: '/gameboard-timer/favicon-32x32.png'},
                {rel: 'icon', sizes: '16x16', href: '/gameboard-timer/favicon-16x16.png'},
                {rel: 'manifest', href: '/gameboard-timer/site.webmanifest'},
                {rel: 'mask-icon', href: '/gameboard-timer/safari-pinned-tab.svg', color: '#1D1D1B'}
                // Material Symbols ya no viene de Google Fonts: assets/css/_icons.scss (SPEC 06)
            ],
            bodyAttrs: {
                class: 'flex'
            }
        },
        pageTransition: {
            name: 'slide',
            mode: 'out-in'
        },
        baseURL: '/gameboard-timer/'
    },
    modules: [
        '@pinia/nuxt'
    ],
    devtools: { enabled: true },
    css: [
        '~/assets/css/master.scss'
    ]
})
