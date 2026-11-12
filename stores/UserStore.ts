import { defineStore } from 'pinia';
import { useTimerStore } from '~/stores/TimerStore'
import { guardWrite } from '~/stores/MainStore'
import type { User, UserCredential } from 'firebase/auth'
import type { DocumentData } from 'firebase/firestore'
import type { TimerData, UserData } from '~/types/models'

// Datos del formulario de registro (components/Page/UserRegisterForm.vue) y de login
type Credentials = { email: string, password: string }
type RegisterData = Credentials & { firstName: string, lastName: string }

const emptyUser = (): UserData => ({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    uid: '',
    guest: true,
    timers: []
});

export const useUserStore = defineStore( 'UserStore', {
    state: () => {
        return {
            user: emptyUser(),
            usrChecked: false,
            userLoad: null as Promise<void> | null // promesa de la carga en curso de los datos del usuario
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
                    // La única carga de datos del usuario: login y recarga pasan por aquí
                    this.userLoad = this.getUserData({ user })
                        .then(() => { this.usrChecked = true })
                        .catch((error) => {
                            // Sin datos no se muestra la app como invitado: el loading avisa a los 15 s
                            console.warn('Could not load user data', error)
                        })
                    return await this.userLoad
                } else {
                    // User is signed out
                    this.usrChecked = true;
                    this.user = emptyUser();

                    const timerStore = useTimerStore();
                    timerStore.timers = [];
                    timerStore.index = 0;
                    return await Promise.resolve();
                }
            });
        },
        async guest(userData: UserData) {
            // función para generar un state para usuarios invitados
            this.user = userData;
            this.user.guest = true;
            return new Promise((resolve) => setTimeout(resolve, 300))
        },
        async register(userData: RegisterData) {
            const { updateUser, registerUser } = useFirebaseAuth(); // auto-imported
            const { setDocument } = useFirestore();
            return await registerUser(userData.email, userData.password)
                .then(async (response) => {
                    // Sin accessToken: un token no se guarda en la base de datos (SPEC 04)
                    this.user = {
                        email: userData.email,
                        username: userData.email.split('@')[0]!,
                        firstName: userData.firstName,
                        lastName: userData.lastName,
                        timers: [],
                        guest: false,
                        uid: response.user.uid
                    };
                    // merge: el listener puede haber creado ya el documento mínimo
                    const sd = guardWrite(setDocument('Users', response.user.uid, this.user, { merge: true }))
                    const us = updateUser({ displayName: this.fullName }).catch(() => {})
                    await Promise.all([sd, us])
                    return response
                })
                .catch((err) => {
                    return err;
                })
        },
        async login(userData: Credentials) {
            const { loginUser } = useFirebaseAuth() // auto-imported
            return await loginUser(userData.email, userData.password)
                .then(async (response) => {
                    // El listener de Auth ya empezó a cargar los datos; se espera esa misma carga
                    await this.userLoad;
                    return response;
                })
                .catch((err) => {
                    return err;
                })
        },
        async logout() {
            const { logoutUser } = useFirebaseAuth();
            return await logoutUser();
        },
        async updateTimers(id: string, action: 'add' | 'delete' = 'add') {
            const { docRef, updateDocument, addToArray, removeFromArray } = useFirestore();
            const ref = docRef('Timers', id);
            if (action === 'add') {
                this.user.timers.push(ref);
                return await guardWrite(updateDocument('Users', this.user.uid, { timers: addToArray(ref) }))
            }
            // Se quita por id, no por posición: el orden local puede no coincidir con el guardado
            this.user.timers = this.user.timers.filter(timer => timer.id !== id);
            return await guardWrite(updateDocument('Users', this.user.uid, { timers: removeFromArray(ref) }))
        },
        async getUserData(response: { user: User } | UserCredential) {
            const { getDocument, setDocument, updateDocument, removeField } = useFirestore();
            const authUser = response.user;
            const docSnap = await getDocument('Users', authUser.uid);
            let data: DocumentData;
            if (docSnap.exists()) {
                data = docSnap.data()!;
                if ('accessToken' in data) {
                    // Limpieza de cuentas viejas: el token no debe quedar en Firestore
                    delete data.accessToken;
                    guardWrite(updateDocument('Users', authUser.uid, { accessToken: removeField() }));
                }
            } else {
                // Cuenta en Auth sin documento (registro a medias): se crea el mínimo
                const [firstName = '', ...rest] = (authUser.displayName || '').split(' ');
                data = {
                    email: authUser.email || '',
                    username: (authUser.email || '').split('@')[0],
                    firstName,
                    lastName: rest.join(' '),
                    uid: authUser.uid,
                    guest: false,
                    timers: []
                };
                await guardWrite(setDocument('Users', authUser.uid, data, { merge: true }));
            }
            data.timers = data.timers || [];

            const snapshots = await Promise.all(data.timers.map((timer: { id: string }) => getDocument('Timers', timer.id)));
            // Un timer borrado o inaccesible no rompe la lista
            const timers = snapshots.filter(snapshot => snapshot.exists()).map(snapshot => snapshot.data() as TimerData);

            this.user = { ...data, guest: false } as UserData;
            useTimerStore().timers = timers;
            return response;
        }
    }
})
