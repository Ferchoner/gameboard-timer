<script setup>
import { useUserStore } from "@/stores/UserStore";
import { useTimerStore, MIN_PLAYERS, MAX_PLAYERS, MAX_NAME_LENGTH } from "@/stores/TimerStore";
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
              aria-label="Close"
              @click="saveTimer(timerStore)"
          />
        </div>
        <div class="modal-body px-1 mx-0">
          <div class="row px-0 mx-0">
            <div class="col-12 form-container mx-0 px-0">
              <form action="/save-timer" @submit.stop.prevent="saveTimer(timerStore)" class="p-0 m-0">
                <div class="row px-0 mx-0">
                  <div v-if="formMessages" :class="`messages text-start px-1 mb-2 ${(hasErrors ? 'error' : '')}`" role="alert">
                    <span> {{ formMessages }} </span>
                  </div>
                  <div class="px-1 mb-3 text-start">
                    <label for="timer-title">Timer Title</label>
                    <input
                        type="text"
                        id="timer-title"
                        class="form-control timer-title mt-2"
                        placeholder="Timer one"
                        v-model="timerStore.timers[timerIndex].title"
                        required
                    >
                  </div>
                  <div class="col-7 mx-0 px-0">
                    <span id="timer-players-label" class="form-label d-inline-block">Players (Timer buttons)</span>
                    <div class="input-group mb-3 px-1" role="group" aria-labelledby="timer-players-label">
                      <span
                          :class="`input-group-text material-symbols-outlined player-count-btn${timerStore.playersCount[timerIndex] <= MIN_PLAYERS ? ' is-disabled' : ''}`"
                          id="basic-addon-minus"
                          role="button"
                          aria-label="Remove last player"
                          :aria-disabled="timerStore.playersCount[timerIndex] <= MIN_PLAYERS"
                          @click="timerStore.removePlayer(timerIndex)"
                      >
                        remove
                      </span>
                      <span class="align-items-center d-flex form-control justify-content-center players-number text-center" aria-live="polite">
                        {{ timerStore.playersCount[timerIndex] }}
                      </span>
                      <span
                          :class="`input-group-text material-symbols-outlined player-count-btn${timerStore.playersCount[timerIndex] >= MAX_PLAYERS ? ' is-disabled' : ''}`"
                          id="basic-addon-plus"
                          role="button"
                          aria-label="Add player"
                          :aria-disabled="timerStore.playersCount[timerIndex] >= MAX_PLAYERS"
                          @click="timerStore.addPlayer(timerIndex)"
                      >
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
                        v-model.number="timerStore.timers[timerIndex].players[0].timeValue"
                    >
                  </div>

                  <div class="col-12 players-container shadow-sm border-bottom mb-2 px-2 mx-0" v-for="(player, i) in timerStore.timers[timerIndex].players">
                    <div class="row px-0 mx-0">
                      <div class="col-8 text-start mb-3 px-0 mx-0">
                        <label :for="`timer-player-name-${i}`" class="form-label">Player name</label>
                        <input
                            type="text" class="form-control"
                            :id="`timer-player-name-${i}`"
                            :maxlength="MAX_NAME_LENGTH"
                            v-model="player.name"
                            required>
                      </div>
                      <div class="col-4 text-start mb-3 px-0 mx-0">
                        <label :for="`timer-player-color-${i}`" class="form-label ms-3">Color</label>
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
              type="button"
              @click="saveTimer(timerStore)"
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
      hasErrors: false,
      isLoading: false
    }
  },
  props: {
    modalid: String,
    timerIndex: Number
  },
  watch: {
    timerIndex() {
      this.clearMessages();
    }
  },
  methods: {
    validate(timer) {
      const errors = [];
      if (!String(timer.title ?? '').trim()) {
        errors.push('Title is required');
      }
      timer.players.forEach((player, i) => {
        if (!String(player.name ?? '').trim()) {
          errors.push(`Player ${i + 1} needs a name`);
        }
      });
      return errors;
    },
    clearMessages() {
      this.formMessages = '';
      this.hasErrors = false;
    },
    saveTimer(timerStore) {
      const errors = this.validate(timerStore.timers[this.timerIndex]);
      if (errors.length) {
        // Con errores no se guarda y el modal sigue abierto
        this.hasErrors = true;
        this.formMessages = `${errors.join('. ')}.`;
        return;
      }
      this.clearMessages();
      timerStore.syncTimer(this.timerIndex);
      const modalEl = document.getElementById(this.modalid);
      if (modalEl) {
        this.$bootstrap.Modal.getOrCreateInstance(modalEl).hide();
      }
    }
  }
}
</script>

<style scoped lang="scss">
.timer-modal {
  > div.modal-dialog {
    .modal-content {
      .modal-body {
        .form-container {
          .messages {
            font-size: 12px;

            &.error {
              color: #e71313;
            }
          }

          .players-number {
            max-width: 55px;
          }

          .player-count-btn {
            cursor: pointer;

            &.is-disabled {
              cursor: not-allowed;
              opacity: 0.4;
            }
          }
        }
      }
    }
  }
}

</style>