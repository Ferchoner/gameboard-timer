<script setup>
import { useUserStore } from "@/stores/UserStore";
import { useTimerStore } from "@/stores/TimerStore";
const userStore = useUserStore();
const timerStore = useTimerStore();
</script>

<template>
  <div
      class="modal fade timer-modal"
      :id="modalid" data-bs-backdrop="static"
      data-bs-keyboard="false"
      tabindex="-1"
      aria-labelledby="Timer-modal"
      aria-hidden="true"
  >
    <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header px-3 mx-0 pb-1 mb-1">
          <h5 class="modal-title" id="staticBackdropLabel">{{ timerStore.timers[timerIndex].title }}</h5>
          <button
              type="button"
              class="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
              @click="timerStore.syncTimer(timerIndex)"
          />
        </div>
        <div class="modal-body px-1 mx-0">
          <div class="row px-0 mx-0">
            <div class="col-12 form-container mx-0 px-0">
              <form action="/save-timer" @submit.stop.prevent="timerStore.syncTimer(timerIndex)" class="p-0 m-0">
                <div class="row px-0 mx-0">
                  <div v-if="formMessages" :class="`messages ${(hasErrors ? 'error' : '')}`">
                    <span> {{ formMessages }} </span>
                  </div>
                  <div class="px-1 mb-3 text-start">
                    <label for="timer-title">Timer Title</label>
                    <input
                        type="text"
                        class="form-control timer-title mt-2"
                        placeholder="Timer one"
                        v-model="timerStore.timers[timerIndex].title"
                        required
                    >
                  </div>
                  <div class="col-7 mx-0 px-0">
                    <label for="timer-players" class="form-label">Players (Timer buttons)</label>
                    <div class="input-group mb-3 px-1">
                      <span class="input-group-text material-symbols-outlined" id="basic-addon-minus" @click="timerStore.removePlayer(timerIndex)">
                        remove
                      </span>
                      <label for="players" class="align-items-center d-flex form-control justify-content-center players-number text-center">
                        {{ timerStore.playersCount[timerIndex] }}
                      </label>
                      <span class="input-group-text material-symbols-outlined" id="basic-addon-plus" @click="timerStore.addPlayer(timerIndex)">
                        add
                      </span>
                    </div>
                  </div>

                  <div class="align-items-center col-5 d-flex justify-content-center mx-0 px-0">
                    <div class="form-check form-switch">
                      <input class="form-check-input" type="checkbox" id="progresive" v-model="timerStore.timers[timerIndex].progresive">
                      <label class="form-check-label" for="progresive">Continuous</label>
                    </div>
                  </div>

                  <div class="text-start mb-3 px-1">
                    <label for="timer-player-time" class="form-label">{{ `Players time (${timerStore.timers[timerIndex].players[0].timeValue} Minutes)` }}</label>
                    <input
                        type="range"
                        class="form-range"
                        :id="`timer-player-time`"
                        min="10"
                        max="120"
                        v-model="timerStore.timers[timerIndex].players[0].timeValue"
                    >
                  </div>

                  <div class="col-12 players-container shadow-sm border-bottom mb-2 px-2 mx-0" v-for="(player, i) in timerStore.timers[timerIndex].players">
                    <div class="row px-0 mx-0">
                      <div class="col-8 text-start mb-3 px-0 mx-0">
                        <label for="timer-player-name" class="form-label">Player name</label>
                        <input
                            type="text" class="form-control"
                            :id="`timer-player-name-${i}`"
                            v-model="player.name"
                            required>
                      </div>
                      <div class="col-4 text-start mb-3 px-0 mx-0">
                        <label for="timer-player-color" class="form-label ms-3">Color</label>
                        <input
                            type="color"
                            class="form-control form-control-color ms-3"
                            :id="`timer-player-color-${i}`"
                            title="Choose the color"
                            v-model="player.color"
                            required
                        >
                      </div>
                    </div>
                  </div>
                </div>
              </form>
              <is-loading-component v-if="isLoading" />
            </div>
          </div>
        </div>
        <div class="modal-footer text-end pt-0 pb-1">
          <button
              class="btn btn-primary mt-2"
              data-bs-dismiss="modal"
              type="submit"
              @click="timerStore.syncTimer(timerIndex)"
          >
            Update Timer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "TimerModal",
  data() {
    return {
      formMessages: '',
      hasErrors: '',
      isLoading: false
    }
  },
  props: {
    modalid: String,
    timerIndex: Number
  }
}
</script>

<style scoped lang="scss">
.timer-modal {
  > div.modal-dialog {
    .modal-content {
      .modal-body {
        .form-container {
          label.players-number {
            max-width: 55px;
          }
        }
      }
    }
  }
}

</style>