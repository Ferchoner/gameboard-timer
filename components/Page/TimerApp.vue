<script setup>
import { useTimerStore } from "@/stores/TimerStore";
import { useUserStore } from "@/stores/UserStore";

const timerStore = useTimerStore();
const userStore = useUserStore();
const route = useRoute();
const timerIndex = Number(route.params.id);

useHead({
  title: 'Timer for friends | Time App',
  bodyAttrs: {
    class: 'blue-body'
  }
})

const timer = computed(() => (Number.isInteger(timerIndex) ? timerStore.timers[timerIndex] : undefined));
const players = computed(() => timer.value?.players ?? []);
const isContinuous = computed(() => players.value.length > 1 && !!timer.value?.progresive);
// Sin timer después de comprobar la sesión: invitado que recargó, enlace viejo o índice inválido
const notFound = computed(() => userStore.usrChecked && !timer.value);

const countdown = useCountdown();
const wakeLock = useWakeLock();
const current = ref(0);
const alarmPending = ref(false);
const timeOverAudio = ref(null);
let synchronizer = null;

const isPlaying = computed(() => countdown.anyRunning());

const formatTime = (i) => {
  const cs = countdown.centiseconds(i);
  return `${Math.trunc(cs / 6000)} : ${String(Math.trunc((cs % 6000) / 100)).padStart(2, '0')}`;
};

// Carga los tiempos iniciales cuando el timer está disponible (con sesión llega después)
let initialized = false;
watch(timer, (t) => {
  if (!t || initialized) return;
  initialized = true;
  countdown.init(t.players.map(player => Number(player.currentTime)));
  startSync();
}, { immediate: true });

function startSync() {
  if (synchronizer) return;
  synchronizer = setInterval(() => {
    if (!timer.value) return;
    const timeValues = players.value.map((_, i) => countdown.centisecondsNow(i));
    timerStore.syncTimeValues(timerIndex, timeValues);
  }, 5000);
}

// Modo normal
function togglePlayer(i) {
  if (countdown.isRunning(i)) {
    countdown.pause(i);
  } else {
    countdown.start(i);
  }
}

function resetPlayer(i) {
  countdown.reset(i, Number(players.value[i].timeValue));
}

// Modo Continuous
function nextWithTime(from) {
  const total = players.value.length;
  for (let k = 1; k <= total; k++) {
    const j = (from + k) % total;
    if (countdown.hasTime(j)) return j;
  }
  return -1;
}

function playContinuous() {
  if (countdown.hasTime(current.value)) {
    countdown.start(current.value);
    return;
  }
  const next = nextWithTime(current.value);
  if (next >= 0) {
    current.value = next;
    countdown.start(next);
  }
}

function nextContinuous() {
  countdown.pauseAll();
  const next = nextWithTime(current.value);
  if (next >= 0) {
    current.value = next;
    countdown.start(next);
  }
}

function pauseContinuous() {
  countdown.pauseAll();
}

function resetAll() {
  countdown.resetAll(Number(players.value[0].timeValue));
  current.value = 0;
}

// Alarma: si la app está en segundo plano, suena al volver
function playTimeAlert(playerNumber) {
  if (document.visibilityState === 'hidden') {
    alarmPending.value = true;
    return;
  }
  const audio = timeOverAudio.value;
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {
      // El navegador puede bloquear el audio; la pantalla ya muestra 0 : 00
    });
  }
  console.log(`Player Number ${(playerNumber + 1)}'s Time is over`);
}

countdown.onFinish(playTimeAlert);

function onVisibilityChange() {
  if (document.visibilityState !== 'visible') return;
  countdown.refresh();
  wakeLock.request();
  if (alarmPending.value) {
    alarmPending.value = false;
    playTimeAlert(current.value);
  }
}

onMounted(() => {
  wakeLock.request();
  document.addEventListener('visibilitychange', onVisibilityChange);
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', onVisibilityChange);
  clearInterval(synchronizer);
  synchronizer = null;
  // Guarda los tiempos finales al salir (no escribe si no cambiaron)
  if (timer.value) {
    timerStore.syncTimeValues(timerIndex, players.value.map((_, i) => countdown.centisecondsNow(i)));
  }
  countdown.dispose();
  wakeLock.release();
});
</script>

<template>
  <div
      v-if="timer"
      class="timer-app d-flex justify-content-center align-items-center overflow-hidden"
  >
    <div class="row align-items-stretch g-4 px-2">
      <div
          v-for="(player, playerIndex) in players"
          :key="playerIndex"
          :class="`col player-container container-${players.length} ${timer.progresive ? 'timer-progresive' : ''}`"
      >
        <div class="card card-cover h-100 overflow-hidden text-white rounded-5 shadow-lg" :style="{ backgroundColor: player.color }">
          <div class="d-flex flex-column h-100 text-white text-shadow-1">
            <h2 class="player-name" :title="player.name">{{ player.name }}</h2>
            <span class="timer-countdown text-center">
              {{ formatTime(playerIndex) }}
            </span>
            <div
                v-if="!isContinuous"
                :class="`d-inline-flex justify-content-center align-items-center text-center players-${players.length}`"
            >
              <button
                  :class="'btn me-2 shadow' + (countdown.isRunning(playerIndex) ? ' btn-secondary' : ' btn-primary')"
                  :aria-label="countdown.isRunning(playerIndex) ? `Pause ${player.name}` : `Start ${player.name}`"
                  @click="togglePlayer(playerIndex)"
              >
                <span v-if="!countdown.isRunning(playerIndex)" class="material-symbols-outlined">
                  play_circle
                </span>
                <span v-else class="material-symbols-outlined">
                  pause_circle
                </span>
              </button>
              <button class="btn btn-danger shadow" :aria-label="`Reset ${player.name}`" @click="resetPlayer(playerIndex)">
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
        v-if="isContinuous"
        :class="`controls players-${players.length} ${timer.progresive}`"
    >
      <button
          :class="'btn me-2' + (isPlaying ? ' btn-secondary' : ' btn-primary')"
          :aria-label="isPlaying ? 'Next player' : 'Start'"
          @click="isPlaying ? nextContinuous() : playContinuous()"
      >
        <span v-if="!isPlaying" class="material-symbols-outlined">
          play_circle
        </span>
        <span v-else class="material-symbols-outlined">
          skip_next
        </span>
      </button>
      <button class="btn btn-danger me-2" aria-label="Pause" @click="pauseContinuous()">
        <span class="material-symbols-outlined">
          pause_circle
        </span>
      </button>
      <button class="btn btn-danger" aria-label="Reset all" @click="resetAll()">
        <span class="material-symbols-outlined">
          stop_circle
        </span>
      </button>
    </div>
    <div class="d-none">
      <audio id="time_over" ref="timeOverAudio">
        <source src="~assets/audio/time_over.mp3" type="audio/mp3">
      </audio>
    </div>
  </div>
  <div
      v-else-if="notFound"
      class="timer-app timer-not-found d-flex flex-column justify-content-center align-items-center text-center px-3"
  >
    <h2 class="mb-3">Timer not found</h2>
    <NuxtLink to="/" class="btn btn-primary">Back to timers</NuxtLink>
  </div>
</template>

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
          // Nombres largos se cortan con "…" en todas las distribuciones (SPEC 06).
          // contain: inline-size evita que el nombre ensanche la tarjeta; el ancho lo ponen
          // el contador y los botones, como con un nombre corto.
          contain: inline-size;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
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