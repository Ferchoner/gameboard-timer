import { defineStore } from 'pinia';
import {useUserStore} from "~/stores/UserStore";
import { guardWrite } from "~/stores/MainStore";
import { faker } from '@faker-js/faker/locale/en';
import type { TimerData, PlayerData } from '~/types/models';

type UserStore = ReturnType<typeof useUserStore>;

export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 12;
export const MAX_NAME_LENGTH = 20; // caracteres por nombre de jugador en el editor

export const useTimerStore = defineStore( 'TimerStore', {
    state: () => {
        return {
            // Timer al crearlo en la app; TimerData tal como llega de Firestore
            timers: [] as TimerData[],
            index: 0
        }
    },
    getters: {
        playersCount: (state) => state.timers.map((timer) => timer.players.length)
    },
    actions: {
        addTimer(data: Partial<TimerData> | string, userStore: UserStore): number {
            this.timers.push(new Timer(data));
            if (userStore.user.uid && userStore.usrChecked) { // User exists in Firestore
                this.syncTimers(this.timers.length - 1, userStore);
            }
            return this.timers.length -1
        },
        removeTimer(index: number): TimerData | undefined {
            const userStore = useUserStore();
            const deletedTimer = this.timers.splice(index, 1);
            // El índice del modal nunca debe quedar fuera de la lista
            if (this.index >= this.timers.length) {
                this.index = Math.max(this.timers.length - 1, 0);
            }
            if (userStore.user.uid && userStore.usrChecked) { // User exists in Firesore
                this.syncTimers(index, userStore, deletedTimer[0]);
            }
            return deletedTimer[0];
        },
        addPlayer(timerIndex: number): number {
            const players = this.timers[timerIndex]!.players;
            if (players.length >= MAX_PLAYERS) {
                return players.length;
            }
            // El jugador nuevo toma el tiempo actual del timer
            const player = new Player();
            if (players.length) {
                player.timeValue = Number(players[0]!.timeValue);
                player.currentTime = player.timeValue;
            }
            return players.push(player);
        },
        removePlayer(timerIndex: number): PlayerData[] {
            // Quita siempre al último jugador; el primero guarda el tiempo del timer
            const players = this.timers[timerIndex]!.players;
            if (players.length <= MIN_PLAYERS) {
                return [];
            }
            return players.splice(players.length - 1, 1);
        },
        async syncTimers(i: number, userStore: UserStore, dTimer?: TimerData) {
            const { setDocument, deleteDocument } = useFirestore();
            const key = faker.string.alphanumeric(5);

            if (!dTimer) {
                this.timers[i]!.FSid = `${userStore.user.uid}-${key}`;
                const frData = { ...this.timers[i]! };
                frData.players = this.timers[i]!.players.map(player => { return {...player} });

                // Primero el timer y después la referencia: las reglas solo dejan referenciar timers propios
                await guardWrite(setDocument('Timers', this.timers[i]!.FSid, frData));
                return await userStore.updateTimers(this.timers[i]!.FSid, 'add');
            }
            else {
                await guardWrite(deleteDocument('Timers', dTimer.FSid));
                return await userStore.updateTimers(dTimer.FSid, 'delete');
            }
        },
        applySharedTime(i: number) {
            // Todos los jugadores comparten el tiempo del primero (invitado o con cuenta)
            const players = this.timers[i]!.players;
            const fixedTime = Number(players[0]!.timeValue);
            players.forEach(player => {
                player.timeValue = fixedTime;
                player.currentTime = fixedTime;
            });
        },
        syncTimer(i: number) {
            this.applySharedTime(i);
            const userStore = useUserStore();
            if (userStore.user.uid && userStore.usrChecked) { // User exists in Firesore
                const { updateDocument } = useFirestore();
                const frData = { ...this.timers[i]! };
                frData.players = this.timers[i]!.players.map(player => ({ ...player }));
                return guardWrite(updateDocument('Timers', this.timers[i]!.FSid, frData));
            }
        },
        // timeValues: centésimas restantes por jugador. Solo escribe si algún tiempo cambió desde
        // lo último guardado (currentTime, en minutos): en pausa no hay escrituras.
        async syncTimeValues(i: number, timeValues: number[]) {
            const userStore = useUserStore();
            const timer = this.timers[i];
            if (!timer || !userStore.user.uid || !userStore.usrChecked) return null;
            const changed = timer.players.some((player, j) =>
                timeValues[j] !== undefined && Math.round(Number(player.currentTime) * 6000) !== timeValues[j]);
            if (!changed) return null;

            const { updateDocument } = useFirestore();
            const frData: { players?: PlayerData[] } = {};  // Only pass players to update them
            frData.players = timer.players.map((player, j) => {
                if (timeValues[j] !== undefined) {
                    player.currentTime = (timeValues[j]! / 6000);
                }
                return {...player}
            });
            return guardWrite(updateDocument('Timers', timer.FSid, frData));
        }
    }
})

export const Timer = class implements TimerData {
    FSid = '';
    progresive = false;
    title = 'Timer Title';
    players: PlayerData[] = [];
    createdAt: TimerData['createdAt'] = new Date();
    updateAt: TimerData['updateAt'] = new Date();

    constructor(data?: Partial<TimerData> | string) {
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            // Copia los campos con valor; los falsos se ignoran a propósito (comportamiento de siempre)
            const fields = data as Record<string, unknown>;
            for(const key in fields) {
                if (fields[key]) {
                    (this as unknown as Record<string, unknown>)[key] = fields[key];
                }
            }
        } else if (typeof data === 'string') {
            this.title = data;
            this.players = [
               new Player(),
               new Player()
            ]
        }
    }
}

export const Player = class implements PlayerData {
    timeValue = 25;
    currentTime = 25;
    name = 'Jack';
    color = '#000000';

    constructor(data?: Partial<PlayerData> | string | number) {
        if (!data) {
            this.timeValue = 25;
            this.currentTime = 25;
            this.name = faker.person.firstName();
            this.color = faker.color.rgb();
        }
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            const fields = data as Record<string, unknown>;
            for(const key in fields) {
                if (fields[key]) {
                    (this as unknown as Record<string, unknown>)[key] = fields[key];
                }
            }
        } else if (typeof data === 'string') {
            this.name = data;
            this.color = faker.color.rgb();
            this.timeValue = 25;
            this.currentTime = 25;
        } else if (typeof data === 'number') {
            this.timeValue = data;
            this.name = faker.person.fullName();
            this.color = faker.color.rgb();
            this.currentTime = 25;
        }
    }
}