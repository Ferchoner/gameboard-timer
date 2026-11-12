<script setup lang="ts">
import { useUserStore } from "~/stores/UserStore";
import { useMainStore } from "~/stores/MainStore";
import { useTimerStore } from "~/stores/TimerStore";
import IsLoadingComponent from "./components/IsLoadingComponent.vue";
const userStore = useUserStore();
</script>

<template>
  <div :class="'the-container d-flex flex-column' + (isTA ? ' black-bg' : '')">
    <HeaderComponent v-if="!isTA" />
    <LightHeader v-if="isTA" />
    <!-- Contenedor fijo para la página: con Nuxt 4, los v-if de header y footer junto a la
         transición de página rompían la navegación (insertBefore). display: contents no cambia
         el layout. -->
    <div class="page-wrapper">
      <NuxtPage />
    </div>
    <FooterComponent v-if="!isTA" />
    <SaveErrorToast />
    <is-loading-component v-if="isLoadingData || !userStore.usrChecked" :failed="loadingFailed" />
  </div>
</template>

<script lang="ts">
import type { UserStore, MainStore } from "~/types/stores";
const LOADING_TIMEOUT_MS = 15000;

export default {
  name: "app",
  data() {
    return {
      isLoadingData: true,
      loadingFailed: false
    }
  },
  computed: {
    isTA: function() {
      return this.$route.name === 'timer-app-id';
    }
  },
  mounted() {
    // Invitado con timers: el navegador pide confirmar antes de recargar o cerrar (SPEC 06).
    // El texto del diálogo lo pone el navegador; el aviso con el detalle está en GuestNotice.
    window.addEventListener('beforeunload', (event) => {
      const userStore = useUserStore();
      const timerStore = useTimerStore();
      if (userStore.usrChecked && userStore.isGuest && timerStore.timers.length) {
        event.preventDefault();
        event.returnValue = '';
      }
    });
    // Si Firebase no responde, el loading no debe quedarse para siempre sin explicación
    setTimeout(() => {
      const userStore = useUserStore();
      if (this.isLoadingData || !userStore.usrChecked) {
        this.loadingFailed = true;
      }
    }, LOADING_TIMEOUT_MS);
    this.restoreSessionData(useUserStore(), useMainStore());
  },
  methods: {
    // El plugin firebase.client.ts corre antes de montar la app: aquí $auth y $firestore ya existen.
    // Si faltaran, el loading se queda y a los 15 s ofrece recargar (SPEC 10, antes un sondeo de 5 ms).
    restoreSessionData(userStore: UserStore, mainStore: MainStore) {
      if (mainStore.checkFirebaseAuth() && mainStore.checkFirestore()) {
        userStore.listenAuth();
        this.isLoadingData = false;
      }
    }
  }
}
</script>

<style lang="scss">
.page-wrapper {
  display: contents;
}
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.2s;
}
.slide-left-enter-from {
  opacity: 0;
  transform: translate(50px, 0);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translate(-50px, 0);
}
.slide-right-enter-from {
  opacity: 0;
  transform: translate(-50px, 0);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translate(50px, 0);
}
</style>