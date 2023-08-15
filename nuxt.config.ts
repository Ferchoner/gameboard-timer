// https://nuxt.com/docs/api/configuration/nuxt-config
// @ts-ignore
export default defineNuxtConfig({
    app: {
        head: {
            title: 'Timer for Friends | Inicio',
            meta: [
                { charset: 'utf-8'},
                { name: 'viewport', content: 'width=device-width, initial-scale=1'},
                { hid: 'description', name: 'description', content: 'Gameboard timers'},
                { name: 'msapplication-TileColor', content: '#ffffff'},
                { name: 'theme-color', content: '#ffffff'}
            ],
            link: [
                {rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png'},
                {rel: 'icon', sizes: '32x32', href: '/favicon-32x32.png'},
                {rel: 'icon', sizes: '16x16', href: '/favicon-16x16.png'},
                {rel: 'manifest', href: '/site.webmanifest'},
                {rel: 'mask-icon', href: '/safari-pinned-tab.svg', color: '#1D1D1B'},
                {rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@48,400,0,0'}
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
    pinia: {
        autoImports: [
            // automatically imports `defineStore`
            'defineStore', // import { defineStore } from 'pinia'
            ['defineStore', 'definePiniaStore'], // import { defineStore as definePiniaStore } from 'pinia'
        ],
    },
    devtools: { enabled: true },
    css: [
        '~/assets/css/master.scss'
    ]
})
