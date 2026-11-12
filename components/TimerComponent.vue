<script setup lang="ts">
import { useTimerStore } from "@/stores/TimerStore";
const timerStore = useTimerStore();
</script>

<template>
  <div class="d-flex text-muted pt-3">
    <div class="pb-3 mb-0 small lh-sm border-bottom w-100">
      <div class="d-flex justify-content-between align-items-center px-2">
        <strong class="text-gray-dark">{{ (timer.title.length > 13 ? `${timer.title.slice(0, 13)}...` : timer.title) + ` (${timerStore.playersCount[timerIndex]} players)` }}</strong>
        <div class="action-buttons">
          <button class="btn btn-sm btn-success me-2" :aria-label="`Play ${timer.title}`" @click="navigateTo(`/timer-app/${timerIndex}`)">
            <span class="material-symbols-outlined" aria-hidden="true">play_circle</span>
          </button>
          <button class="btn btn-sm btn-primary me-2" data-bs-toggle="modal" data-bs-target="#timer-form-backdrop" :aria-label="`Edit ${timer.title}`" @click="timerStore.index = timerIndex">
            <span class="material-symbols-outlined" aria-hidden="true">edit</span>
          </button>
          <button class="btn btn-sm btn-danger" :aria-label="`Delete ${timer.title}`" @click="confirmRemove(timerStore)">
            <span class="material-symbols-outlined" aria-hidden="true">delete</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import type { TimerStore } from "~/types/stores";

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
  },
  methods: {
    confirmRemove(timerStore: TimerStore) {
      if (window.confirm(`Delete "${this.timer.title}"?`)) {
        timerStore.removeTimer(this.timerIndex);
      }
    }
  }
}
</script>

<style scoped>
.action-buttons {
  min-width: 144px;
}
</style>