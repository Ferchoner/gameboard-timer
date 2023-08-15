import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, DocumentSnapshot, QuerySnapshot, DocumentReference } from 'firebase/firestore'

export default function() {
    const { $firestore } = useNuxtApp()

    const isReady = (): Boolean => {
        return !!$firestore;
    }

    const docRef = (collectionName: string, docId: string): DocumentReference => {
        // @ts-ignore
        return doc($firestore, collectionName, docId);
    }

    const setDocument = async (collectionName: string, docId: string, docData: Object): Promise<void> => {
        // @ts-ignore
        return await setDoc(doc($firestore, collectionName, docId), docData);
    }

    const updateDocument = async (collectionName: string, docId: string, docData: Object): Promise<void> => {
        // @ts-ignore
        return await updateDoc(doc($firestore, collectionName, docId), docData);
    }

    const getDocument = async (collectionName: string, docId: string): Promise<DocumentSnapshot> => {
        // @ts-ignore
        return await getDoc(doc($firestore, collectionName, docId));
    }

    const deleteDocument = async (collectionName: string, docId: string): Promise<DocumentSnapshot> => {
        // @ts-ignore
        return await deleteDoc(doc($firestore, collectionName, docId));
    }

    const queryDocument = async (collectionName: string, conds: Object): Promise<QuerySnapshot> => {
        // @ts-ignore
        const q = query(collection($firestore, collectionName), where(conds.field, conds.filter, conds.value));
        return await getDocs(q);
    }

    const getDocuments = async (collectionName: string) : Promise<QuerySnapshot> => {
        // @ts-ignore
        return await getDocs(collection($firestore, collectionName));
    }

    return {
        docRef,
        isReady,
        setDocument,
        updateDocument,
        deleteDocument,
        getDocument,
        getDocuments,
        queryDocument
    }
}