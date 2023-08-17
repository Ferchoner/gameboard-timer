<script setup>
import { useTimerStore } from "@/stores/TimerStore";
const timerStore = useTimerStore();
const route = useRoute();
const timerIndex = route.params.id;
useHead({
  title: 'Timer for friends | Time App',
  bodyAttrs: {
    class: 'blue-body'
  }
})
</script>

<template>
  <div
      v-if="timerStore && timerStore.timers && timerStore.timers.length"
      class="timer-app d-flex justify-content-center align-items-center overflow-hidden"
      @click.once="startSync(timerStore, timerIndex)"
  >
    <div class="row align-items-stretch g-4 px-2">
      <div
          v-for="(player, playerIndex) in timerStore.timers[timerIndex].players"
          :class="`col player-container container-${timerStore.timers[timerIndex].players.length} ${timerStore.timers[timerIndex].progresive ? 'timer-progresive' : ''}`"
          @click.once="passData(playerIndex, player.currentTime)">
        <div class="card card-cover h-100 overflow-hidden text-white rounded-5 shadow-lg" :style="{ backgroundColor: player.color }">
          <div class="d-flex flex-column h-100 text-white text-shadow-1">
            <h2 class="player-name">{{ player.name }}</h2>
            <span class="timer-countdown text-center">
              {{ Math.trunc(timeInSeconds[playerIndex] / 6000)  }} : {{ ((Math.trunc((timeInSeconds[playerIndex] % 6000)/100)).toString()).padStart(2, '0') }}
            </span>
            <div
                v-if="timerStore.timers[timerIndex].players.length <= 1 || !timerStore.timers[timerIndex].progresive"
                :class="`d-inline-flex justify-content-center align-items-center text-center players-${timerStore.timers[timerIndex].players.length}`"
            >
              <button
                  :class="'btn me-2 shadow' + (((!timerStore.timers[timerIndex].progresive && playersInProgress[playerIndex]) || (timerStore.timers[timerIndex].progresive && is_playing)) ? ' btn-secondary' : ' btn-primary')"
                  @click="((!timerStore.timers[timerIndex].progresive && playersInProgress[playerIndex]) || (timerStore.timers[timerIndex].progresive && is_playing)) ? pauseTimer(playerIndex) : startTimer(playerIndex)"
              >
                <span v-if="(!timerStore.timers[timerIndex].progresive && !playersInProgress[playerIndex]) || (timerStore.timers[timerIndex].progresive && !is_playing)" class="material-symbols-outlined">
                  play_circle
                </span>
                <span v-else class="material-symbols-outlined">
                  pause_circle
                </span>
              </button>
              <button class="btn btn-danger shadow" @click="resetTimer(playerIndex, player.timeValue)">
                <span class="material-symbols-outlined">
                  stop_circle
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
        v-if="timerStore.timers[timerIndex].players.length > 1 && timerStore.timers[timerIndex].progresive"
        :class="`controls players-${timerStore.timers[timerIndex].players.length} ${timerStore.timers[timerIndex].progresive}`"
    >
      <button
          :class="'btn me-2' + (is_playing ? ' btn-secondary' : ' btn-primary')"
          @click="is_playing ? startNextTimer(timerStore.timers[timerIndex].players.length) : startTimer(current)"
      >
        <span v-if="!is_playing" class="material-symbols-outlined">
          play_circle
        </span>
        <span v-else class="material-symbols-outlined">
          skip_next
        </span>
      </button>
      <button class="btn btn-danger me-2" @click="pauseTimer(current)">
        <span class="material-symbols-outlined">
          pause_circle
        </span>
      </button>
      <button
          class="btn btn-danger"
          @click="resetAllTimers(timerStore.timers[timerIndex].players[0].timeValue, timerStore.timers[timerIndex].players.length)"
      >
        <span class="material-symbols-outlined">
          stop_circle
        </span>
      </button>
    </div>
    <div class="d-none">
      <audio id="time_over">
        <source src="~assets/audio/time_over.mp3" type="audio/mp3">
      </audio>
    </div>
  </div>
</template>

<script>
export default {
  name: "TimerApp",
  data() {
    return {
      is_playing: false,
      playersInProgress: [
        false, false, false, false, false, false, false, false, false, false, false, false
      ],
      counters: [
        null, null, null, null, null, null, null, null, null, null, null, null
      ],
      timeInSeconds: [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
      ],
      synchronizer: 0,
      current: 0
    }
  },
  mounted() {
    const playerC = document.querySelectorAll('.player-container');
    const mainC = document.querySelector('.timer-app');
    if (mainC) {
      mainC.dispatchEvent(new Event('click'));
    } else {
      const mainChecker = setInterval(() => {
        const mainC = document.querySelector('.timer-app');
        if (mainC) {
          clearInterval(mainChecker);
          mainC.dispatchEvent(new Event('click'));
        }
      }, 500);
    }
    if (playerC && playerC.length) {
      playerC.forEach((el) => {
        el.dispatchEvent(new Event('click'))
      });
    } else {
      const checker = setInterval(() => {
        const playerC = document.querySelectorAll('.player-container');
        if (playerC && playerC.length) {
          clearInterval(checker)
          playerC.forEach((el) => {
            el.dispatchEvent(new Event('click'))
          });
        }
      }, 500)
    }
  },
  unmounted() {
    clearInterval(this.synchronizer);
    this.counters.map(cc => (cc ? clearInterval(cc) : false));
  },
  methods: {
    passData(i, value) {
      this.timeInSeconds[i] = value * 6000;
    },
    startNextTimer(limit) {
      const previous = this.current;
      if (this.current < (limit - 1)) {
        this.current += 1;
      } else {
        this.current = 0;
      }
      if (this.timeInSeconds[this.current] > 0 ) {
        this.playersInProgress[previous] = false;
        clearInterval(this.counters[previous]); // Pausamos el actual
        this.playersInProgress[this.current] = true;
        this.counters[this.current] = setInterval(this.startCountdown, 10, this.current);
      }
    },
    startTimer(index) {
      if (this.timeInSeconds[index] > 0 ) {
        this.is_playing = true;
        this.playersInProgress[index] = true;
        this.counters[index] = setInterval(this.startCountdown, 10, index);
      }
    },
    pauseTimer(index) {
      this.is_playing = false;
      this.playersInProgress[index] = false;
      clearInterval(this.counters[index]);
    },
    resetTimer(i, value) {
      this.is_playing = false;
      this.playersInProgress[i] = false;
      clearInterval(this.counters[i]);
      this.timeInSeconds[i] = value * 6000;
    },
    resetAllTimers(time, length) {
      this.is_playing = false;
      this.counters.map(counter => clearInterval(counter));
      for (let i = 0; i < length; i++) {
        this.playersInProgress[i] = false;
        this.timeInSeconds[i] = time * 6000;
      }
      this.current = 0;
    },
    startCountdown(ix) {
      this.timeInSeconds[ix] -= 1
      if (this.timeInSeconds[ix] <= 0) {
        this.is_playing = false;
        clearInterval(this.counters[ix]);
        this.playTimeAlert(ix);
      }
    },
    playTimeAlert(playerNumber) {
      const audio = document.querySelector('#time_over')
      if (audio) {
        audio.play();
      }
      console.log(`Player Number ${(playerNumber + 1)}'s Time is over`);
    },
    startSync(timerStore, index) {
      this.synchronizer = setInterval(() => timerStore.syncTimeValues(index, this.timeInSeconds), 5000)
    }
  }
}
</script>

<style scoped lang="scss">
.timer-app {
  background-color: #02204b;
  height: calc(100vh - 20px);
  color: #ffffff;

  .player-container {
    .card {
      > div {
        min-width: 22vw;
        padding-right: 1rem;
        padding-left: 1rem;
        padding-top: 1.5rem;
        padding-bottom: 1.5rem;

        .player-name {
          font-family: Khand, Handjet, sans-serif;
          font-weight: 700;
        }

        .timer-countdown {
          font-size: 40px;
          line-height: 40px;
          padding-bottom: 1rem;
        }

        .players-3 {
          button {
            padding: 0.2rem 0.35rem;
          }
        }

        .players-4 {
          button {
            padding: 0.2rem 0.35rem;
          }
        }

        .players-5, .players-6 {
          button {
            padding: 0.2rem 0.35rem;
          }
        }

        .players-7, .players-8, .players-9, .players-10, .players-11, .players-12 {
          button {
            padding: 0.1rem 0.1rem;
            display: flex;

            span {
              font-size: 18px;
              line-height: 18px;
            }
          }
        }
      }
    }

    &.container-3 {
      .timer-countdown {
        min-width: 90px;
      }
    }

    &.container-4 {
      .player-name {
        font-size: 20px;
      }
      .timer-countdown {
        min-width: 90px;
      }
    }

    &.container-5, &.container-6 {
      .card {
        > div {
          padding-right: 0.3rem;
          padding-left: 0.3rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;

          .player-name {
            text-align: center;
            font-size: 15px;
            font-weight: 500;
            white-space: nowrap;
            margin-bottom: 2px;
          }

          .timer-countdown {
            font-size: 30px;
            line-height: 30px;
            padding-bottom: 0.2rem;
          }
        }
      }
    }

    &.container-7, &.container-8, &.container-9, &.container-10, &.container-11, &.container-12 {
      .card {
        > div {
          padding-right: 0.3rem;
          padding-left: 0.3rem;
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;

          .player-name {
            text-align: center;
            font-size: 15px;
            font-weight: 500;
            white-space: nowrap;
            margin-bottom: 2px;
          }

          .timer-countdown {
            font-size: 23px;
            line-height: 20px;
            padding-bottom: 0.2rem;
          }
        }
      }
    }
  }

  .controls {
    &.players-2,
    &.players-3,
    &.players-4,
    &.players-5,
    &.players-6,
    &.players-7,
    &.players-8,
    &.players-9,
    &.players-10,
    &.players-11,
    &.players-12 {
      position: absolute;
      bottom: 15px;
    }

    &.players-2,
    &.players-3,
    &.players-4 {
       .btn {
         padding: 12px 14px;

         &.me-2 {
           margin-right: 0.8rem !important;
         }
       }
    }
  }
}
</style>