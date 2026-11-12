import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, arrayUnion, arrayRemove, deleteField } from 'firebase/firestore'
import type { DocumentSnapshot, QuerySnapshot, DocumentReference, DocumentData, FieldValue, SetOptions, WhereFilterOp } from 'firebase/firestore'

// Condición de queryDocument: where(field, filter, value)
type QueryCondition = { field: string, filter: WhereFilterOp, value: unknown }

export default function() {
    const { $firestore } = useNuxtApp()

    const isReady = (): boolean => {
        return !!$firestore;
    }

    const docRef = (collectionName: string, docId: string): DocumentReference => {
        return doc($firestore, collectionName, docId);
    }

    const setDocument = async (collectionName: string, docId: string, docData: DocumentData, options: SetOptions = {}): Promise<void> => {
        return await setDoc(doc($firestore, collectionName, docId), docData, options);
    }

    const updateDocument = async (collectionName: string, docId: string, docData: DocumentData): Promise<void> => {
        return await updateDoc(doc($firestore, collectionName, docId), docData);
    }

    const getDocument = async (collectionName: string, docId: string): Promise<DocumentSnapshot> => {
        return await getDoc(doc($firestore, collectionName, docId));
    }

    const deleteDocument = async (collectionName: string, docId: string): Promise<void> => {
        return await deleteDoc(doc($firestore, collectionName, docId));
    }

    const queryDocument = async (collectionName: string, conds: QueryCondition): Promise<QuerySnapshot> => {
        const q = query(collection($firestore, collectionName), where(conds.field, conds.filter, conds.value));
        return await getDocs(q);
    }

    const getDocuments = async (collectionName: string) : Promise<QuerySnapshot> => {
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