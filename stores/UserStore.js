import { defineStore } from 'pinia';
import { useTimerStore } from '~/stores/TimerStore'

export const useUserStore = defineStore( 'UserStore', {
    state: () => {
        return {
            user: {
                email: '',
                username: '',
                firstName: '',
                lastName: '',
                accessToken: '',
                uid: '',
                guest: true,
                timers: []
            },
            usrChecked: false
        }
    },
    getters: {
        fullName: state => `${state.user.firstName} ${state.user.lastName}`,
        isLogged: state => !!state.user?.email,
        isGuest: state => state.user.guest
    },
    actions: {
        listenAuth() {
            const { listenForAuth } = useFirebaseAuth() // auto-imported
            listenForAuth(async (user) => {
                if (user) {
                    this.getUserData({user: user}).then(() => this.usrChecked = true)
                } else {
                    // User is signed out
                    // ...
                    this.usrChecked = true;
                    this.user = {
                        email: '',
                        username: '',
                        firstName: '',
                        lastName: '',
                        accessToken: '',
                        uid: '',
                        guest: true,
                        timers: []
                    }

                    const timerStore = useTimerStore();
                    timerStore.timers = [];
                    timerStore.index = 0;
                    return await Promise.resolve();
                }
            });
        },
        async guest(userData) {
            // función para generar un state para usuarios invitados
            this.user = userData;
            this.user.guest = true;
            return new Promise((resolve) => setTimeout(resolve, 300))
        },
        async register(userData) {
            const { updateUser, registerUser } = useFirebaseAuth(); // auto-imported
            const { setDocument } = useFirestore();
            return await registerUser(userData.email, userData.password)
                .then(async (response) => {
                    // @ts-ignore
                    this.user = {
                        email: userData.email,
                        username: userData.email.split('@')[0],
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        timers: [],
                        guest: false,
                        accessToken: response.user.accessToken,
                        uid: response.user.uid
                    };
                    const sd = setDocument('Users', response.user.uid, this.user)
                    const us = updateUser({ displayName: this.fullName })
                    return await Promise.all([sd, us])
                        .then((responses) => {
                            return response
                        })
                        .catch((errs) => {
                            return response
                        })
                })
                .catch((err) => {
                    return err;
                })
        },
        async login(userData) {
            const { loginUser } = useFirebaseAuth() // auto-imported
            return await loginUser(userData.email, userData.password)
                .then(this.getUserData)
                .catch((err) => {
                    return err;
                })
        },
        async logout() {
            const { logoutUser } = useFirebaseAuth();
            return await logoutUser();
        },
        async updateTimers(id, action = 'add') {
            const { docRef, updateDocument } = useFirestore();
            if (action === 'add') {
                this.user.timers.push(docRef('Timers', id));
            } else {
                this.user.timers.splice(id, 1);
            }
            return await updateDocument('Users', this.user.uid, {timers: this.user.timers})
        },
        async getUserData(response) {
            const { getDocument } = useFirestore();
            return await getDocument('Users', response.user.uid)
                .then(async (docSnap) => {
                    if (docSnap.exists()) {
                        this.user = docSnap.data();
                        const timerStore = useTimerStore();
                        const timers = await Promise.all(this.user.timers.map(async (timer) => {
                            return await getDocument('Timers', timer.id)
                        })).then(snpShts => snpShts.map(snpSht => snpSht.data()));
                        this.user.guest = false;
                        timerStore.timers = timers
                        return response;
                    }
                });
        }
    }
})