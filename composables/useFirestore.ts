import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore'
import type { DocumentSnapshot, QuerySnapshot, DocumentReference, FieldValue, SetOptions } from 'firebase/firestore'

export default function() {
    const { $firestore } = useNuxtApp()

    const isReady = (): Boolean => {
        return !!$firestore;
    }

    const docRef = (collectionName: string, docId: string): DocumentReference => {
        // @ts-ignore
        return doc($firestore, collectionName, docId);
    }

    const setDocument = async (collectionName: string, docId: string, docData: Object, options: SetOptions = {}): Promise<void> => {
        // @ts-ignore
        return await setDoc(doc($firestore, collectionName, docId), docData, options);
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

    // Valores especiales de Firestore para updateDocument
    const addToArray = (...values: unknown[]): FieldValue => arrayUnion(...values);
    const removeFromArray = (...values: unknown[]): FieldValue => arrayRemove(...values);
    const removeField = (): FieldValue => deleteField();

    return {
        docRef,
        addToArray,
        removeFromArray,
        removeField,
        isReady,
        setDocument,
        updateDocument,
        deleteDocument,
        getDocument,
        getDocuments,
        queryDocument
    }
}