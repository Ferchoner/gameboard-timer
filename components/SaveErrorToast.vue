<script setup>
import { useMainStore } from '~/stores/MainStore'
const mainStore = useMainStore()
</script>

<template>
  <div v-if="mainStore.saveError" class="save-error alert alert-danger alert-dismissible" role="alert">
    Couldn't save changes. Check your connection.
    <button type="button" class="btn-close" aria-label="Close" @click="mainStore.dismissSaveError()"></button>
  </div>
</template>

<style scoped lang="scss">
.save-error {
  position: fixed;
  left: 50%;
  bottom: 16px;
  transform: translateX(-50%);
  width: calc(100% - 32px);
  max-width: 480px;
  margin: 0;
  z-index: 1100;
}
</style>
