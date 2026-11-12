// Tipos de los stores para props y parámetros de componentes (SPEC 07)
import type { useUserStore } from '~/stores/UserStore'
import type { useTimerStore } from '~/stores/TimerStore'
import type { useMainStore } from '~/stores/MainStore'

export type UserStore = ReturnType<typeof useUserStore>
export type TimerStore = ReturnType<typeof useTimerStore>
export type MainStore = ReturnType<typeof useMainStore>
