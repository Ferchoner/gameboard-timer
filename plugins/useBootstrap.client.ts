// Solo el módulo Modal de Bootstrap (SPEC 10): es lo único que usa la app. Registra también su
// API de datos, así que data-bs-toggle="modal" y data-bs-dismiss="modal" siguen funcionando.
import Modal from 'bootstrap/js/dist/modal'

export default defineNuxtPlugin(nuxtApp => {
    nuxtApp.provide('bootstrap', { Modal })
})
