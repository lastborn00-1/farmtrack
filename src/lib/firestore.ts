import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  serverTimestamp,
} from 'firebase/firestore';
import type {
  QueryConstraint,
  DocumentData,
  WithFieldValue
} from 'firebase/firestore';
import { db } from '@/firebase/config';

export const getFarmCollectionPath = (farmId: string, subCollection: string) => {
  return `farms/${farmId}/${subCollection}`;
};

export async function addFarmDocument<T extends WithFieldValue<DocumentData>>(farmId: string, subCollection: string, data: T) {
  const collRef = collection(db, getFarmCollectionPath(farmId, subCollection));
  const docRef = await addDoc(collRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
}

export async function updateFarmDocument<T extends DocumentData>(farmId: string, subCollection: string, docId: string, data: Partial<T>) {
  const docRef = doc(db, getFarmCollectionPath(farmId, subCollection), docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
}

export async function deleteFarmDocument(farmId: string, subCollection: string, docId: string) {
  const docRef = doc(db, getFarmCollectionPath(farmId, subCollection), docId);
  await deleteDoc(docRef);
}

export async function getFarmDocument<T = DocumentData>(farmId: string, subCollection: string, docId: string): Promise<T | null> {
  const docRef = doc(db, getFarmCollectionPath(farmId, subCollection), docId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as T;
  }
  return null;
}

export async function getFarmDocuments<T = DocumentData>(farmId: string, subCollection: string, constraints: QueryConstraint[] = []): Promise<T[]> {
  const collRef = collection(db, getFarmCollectionPath(farmId, subCollection));
  const q = query(collRef, ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as T);
}

// Global collections (e.g. users, farms)
export async function getGlobalDocument<T = DocumentData>(collName: string, docId: string): Promise<T | null> {
  const docRef = doc(db, collName, docId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return { id: snap.id, ...snap.data() } as T;
  }
  return null;
}

export async function setGlobalDocument<T extends WithFieldValue<DocumentData>>(collName: string, docId: string, data: T) {
  const docRef = doc(db, collName, docId);
  const { setDoc } = await import('firebase/firestore');
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  }, { merge: true });
}
