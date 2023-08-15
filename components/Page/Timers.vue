<script setup>
import { useUserStore } from "@/stores/UserStore";
import { useTimerStore } from "@/stores/TimerStore";
const userStore = useUserStore();
const timerStore = useTimerStore();

useHead({
  title: 'Timer for friends | Timers'
})
</script>

<template>
  <div class="container timer-page">
    <div class="my-3 rounded">
      <div class="d-flex">
        <div class="pb-3 mb-0 w-100">
          <div class="d-flex justify-content-between border-bottom pb-2 align-items-center px-2">
            <h6 class="pb-2 mb-0">Timers</h6>
            <div class="action-buttons">
              <button class="btn btn-sm btn-success" @click="addTimer(timerStore, 'New Timer', userStore)">
                <span class="material-symbols-outlined">add_circle</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <TimerComponent
          v-for="(timer, i) in timerStore.timers"
          :timer="timer"
          :timer-index="i"
      />
    </div>
    <IsLoadingComponent v-if="isLoading"/>
    <!-- Modal -->
    <TimerModal v-if="timerStore.timers.length" modalid="timer-form-backdrop" :timer-index="timerStore.index"/>
  </div>
</template>

<script>
export default {
  name: "Timers",
  data() {
    return {
      isLoading: false
    }
  },
  methods: {
    addTimer(timerStore, title, userStore) {
      timerStore.addTimer(title, userStore);
    }
  }
}
</script>

<style scoped lang="scss">
.timer-page {
  h6 {
    font-size: 20px;
    line-height: 20px;
    font-family: Khand, Handjet, sans-serif;
  }
}
</style>