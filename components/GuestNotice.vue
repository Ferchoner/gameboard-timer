<script setup lang="ts">
import { useUserStore } from '~/stores/UserStore'
import { useTimerStore } from '~/stores/TimerStore'
const userStore = useUserStore()
const timerStore = useTimerStore()
</script>

<template>
  <!-- Como invitado los timers viven solo en memoria: se avisa antes de que se pierdan (SPEC 06) -->
  <div v-if="userStore.usrChecked && userStore.isGuest && timerStore.timers.length" class="guest-notice alert alert-warning small mx-2 my-2 py-2" role="status">
    Guest mode: your timers are lost if you reload or close this page.
    <NuxtLink to="/user/signup-form" class="alert-link">Sign up</NuxtLink> to keep them.
  </div>
</template>
