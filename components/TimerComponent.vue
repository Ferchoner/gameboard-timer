<script setup>
import { useTimerStore } from "@/stores/TimerStore";
const timerStore = useTimerStore();
</script>

<template>
  <div class="d-flex text-muted pt-3">
    <div class="pb-3 mb-0 small lh-sm border-bottom w-100">
      <div class="d-flex justify-content-between align-items-center px-2">
        <strong class="text-gray-dark">{{ (timer.title.length > 13 ? `${timer.title.slice(0, 13)}...` : timer.title) + ` (${timerStore.playersCount[timerIndex]} players)` }}</strong>
        <div class="action-buttons">
          <button class="btn btn-sm btn-success me-2" @click="navigateTo(`/timer-app/${timerIndex}`)">
            <span class="material-symbols-outlined">play_circle</span>
          </button>
          <button class="btn btn-sm btn-primary me-2" data-bs-toggle="modal" data-bs-target="#timer-form-backdrop" @click="timerStore.index = timerIndex">
            <span class="material-symbols-outlined">edit</span>
          </button>
          <button class="btn btn-sm btn-danger" @click="() => timerStore.removeTimer(timerIndex)">
            <span class="material-symbols-outlined">delete</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TimerComponent",
  props: {
    timer: {
      type: Object,
      default: {}
    },
    timerIndex: {
      type: Number,
      default: 0
    }
  }
}
</script>

<style scoped>
.action-buttons {
  min-width: 144px;
}
</style>