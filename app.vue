<script setup>
import { useUserStore } from "~/stores/UserStore";
import { useMainStore } from "~/stores/MainStore";
import IsLoadingComponent from "./components/IsLoadingComponent";
const userStore = useUserStore();
const mainStore = useMainStore();
</script>

<template>
  <div :class="'the-container d-flex flex-column' + (isTA ? ' black-bg' : '')" @click.once="() => restoreSessionData(userStore, mainStore)">
    <HeaderComponent v-if="!isTA" />
    <LightHeader v-if="isTA" />
    <NuxtPage />
    <FooterComponent v-if="!isTA" />
    <is-loading-component v-if="isLoadingData || !userStore.usrChecked" />
  </div>
</template>

<script>
export default {
  name: "app",
  data() {
    return {
      isLoadingData: true
    }
  },
  computed: {
    isTA: function() {
      return this.$route.name === 'timer-app-id';
    }
  },
  mounted() {
    const mainC = document.querySelector('.the-container')
    if (mainC) {
      mainC.dispatchEvent(new Event('click'))
    }
  },
  methods: {
    async restoreSessionData(userStore, mainStore) {
      const checker = setInterval(() => {
        if (mainStore && mainStore.checkFirebaseAuth() && mainStore.checkFirestore()) {
          clearInterval(checker);
          userStore.listenAuth()
          this.isLoadingData = false
        }
      }, 5);
    }
  }
}
</script>

<style lang="scss">
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