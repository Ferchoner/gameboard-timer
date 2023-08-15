import { updateProfile, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut, UserCredential, NextOrObserver, User} from 'firebase/auth'

export default function() {
    const { $auth } = useNuxtApp()

    const isReady = (): Boolean => {
        return !!$auth;
    }

    const listenForAuth = (callback: NextOrObserver<User>): void => {
        // @ts-ignore
        onAuthStateChanged($auth, callback)
    }

    const checkAuth = () => {
        // @ts-ignore
        const usr = $auth.currentUser;
        return usr !== null ? usr : '';
    }

    const updateUser = async (userData: Object): Promise<void> => {
        // @ts-ignore
        if ($auth.currentUser) {
            // @ts-ignore
            return await updateProfile($auth.currentUser, userData);
        }
        return Promise.reject('There is no user logged in');
    }

    const registerUser = async (email: string, password: string): Promise<UserCredential> => {
        // @ts-ignore
        return await createUserWithEmailAndPassword($auth, email, password)
    }

    const loginUser = async (email: string, password: string): Promise<UserCredential> => {
        // @ts-ignore
        return await signInWithEmailAndPassword($auth, email, password)
    }

    const logoutUser = async (): Promise<void> => {
        // @ts-ignore
        return await signOut($auth);
    }

    return {
        listenForAuth,
        isReady,
        checkAuth,
        updateUser,
        registerUser,
        loginUser,
        logoutUser,
    }
}