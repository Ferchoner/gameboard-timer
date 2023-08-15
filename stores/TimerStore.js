import { defineStore } from 'pinia';
import {useUserStore} from "~/stores/UserStore";
import { faker } from '@faker-js/faker/locale/en';

export const useTimerStore = defineStore( 'TimerStore', {
    state: () => {
        return {
            timers: [],
            index: 0
        }
    },
    getters: {
        playersCount: (state) => state.timers.map((timer) => timer.players.length)
    },
    actions: {
        addTimer(data, userStore) {
            this.timers.push(new Timer(data));
            if (userStore.user.uid && userStore.usrChecked) { // User exists in Firestore
                this.syncTimers(this.timers.length - 1, userStore);
            }
            return this.timers.length -1
        },
        removeTimer(index) {
            const userStore = useUserStore();
            const deletedTimer = this.timers.splice(index, 1);
            if (userStore.user.uid && userStore.usrChecked) { // User exists in Firesore
                this.syncTimers(index, userStore, deletedTimer[0]);
            }
            return deletedTimer[0];
        },
        addPlayer(timerIndex, data) {
            return this.timers[timerIndex].players.push(new Player(data));
        },
        removePlayer(timerIndex, playerIndex) {
            return this.timers[timerIndex].players.splice(playerIndex, 1);
        },
        async syncTimers(i, userStore, dTimer) {
            const { setDocument, deleteDocument } = useFirestore();
            const key = faker.string.alphanumeric(5);

            if (!dTimer) {
                this.timers[i].FSid = `${userStore.user.uid}-${key}`;
                const frData = { ...this.timers[i] };
                frData.players = this.timers[i].players.map(player => { return {...player} });

                return await Promise.all([
                    await setDocument('Timers', this.timers[i].FSid, frData),
                    await userStore.updateTimers(this.timers[i].FSid, 'add')
                ]);
            }
            else {
                return await Promise.all([
                    await deleteDocument('Timers', dTimer.FSid),
                    await userStore.updateTimers(i, 'delete')
                ])
            }
        },
        syncTimer(i) {
            const userStore = useUserStore();
            if (userStore.user.uid && userStore.usrChecked) { // User exists in Firesore
                const { updateDocument } = useFirestore();
                const frData = { ...this.timers[i] };
                const fixedTime = this.timers[i].players[0].timeValue;
                frData.players = this.timers[i].players.map(player => {
                    player.timeValue = fixedTime
                    player.currentTime = fixedTime
                    return {...player}
                });
                updateDocument('Timers', this.timers[i].FSid, frData);
            }
        },
        async syncTimeValues(i, timeValues) {
            const userStore = useUserStore();
            if (userStore.user.uid && userStore.usrChecked) { // User exists in Firesore
                const { updateDocument } = useFirestore();
                const frData = {};  // Only pass players to update them
                const fixedTime = this.timers[i].players[0].timeValue;
                frData.players = this.timers[i].players.map((player, j) => {
                    player.currentTime = (timeValues[j] / 6000);
                    return {...player}
                });
                updateDocument('Timers', this.timers[i].FSid, frData);
            }
        }
    }
})

export const Timer = class {
    FSid = '';
    progresive = false;
    title = 'Timer Title';
    players = [];
    createdAt = new Date();
    updateAt = new Date();

    constructor(data) {
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            for(const key in data) {
                if (data[key]) {
                    this[key] = data[key];
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

export const Player = class {
    timeValue = 25;
    currentTime = 25;
    name = 'Jack';
    color = '#000000';

    constructor(data) {
        if (!data) {
            this.timeValue = 25;
            this.currentTime = 25;
            this.name = faker.person.firstName();
            this.color = faker.color.rgb();
        }
        if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
            for(const key in data) {
                if (data[key]) {
                    this[key] = data[key];
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