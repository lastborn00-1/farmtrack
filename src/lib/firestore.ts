import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  getDocFromCache,
  getDocsFromCache,
  setDoc,
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

const withOfflineTimeout = <T>(promise: Promise<T>, ms: number = 3000): Promise<T | void> => {
  return Promise.race([
    promise,
    new Promise<void>((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), ms))
  ]).catch(e => {
    if (e?.message === 'TIMEOUT') {
      console.warn('Network timeout, write queued locally.');
    } else {
      throw e;
    }
  });
};

export async function addFarmDocument<T extends WithFieldValue<DocumentData>>(farmId: string, subCollection: string, data: T) {
  const collRef = collection(db, getFarmCollectionPath(farmId, subCollection));
  const docRef = doc(collRef);
  const promise = setDoc(docRef, {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  if (!navigator.onLine) return docRef.id;
  await withOfflineTimeout(promise);
  return docRef.id;
}

export async function updateFarmDocument<T extends DocumentData>(farmId: string, subCollection: string, docId: string, data: Partial<T>) {
  const docRef = doc(db, getFarmCollectionPath(farmId, subCollection), docId);
  const promise = updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
  
  if (!navigator.onLine) return;
  await withOfflineTimeout(promise);
}

export async function deleteFarmDocument(farmId: string, subCollection: string, docId: string) {
  const docRef = doc(db, getFarmCollectionPath(farmId, subCollection), docId);
  const promise = deleteDoc(docRef);
  
  if (!navigator.onLine) return;
  await withOfflineTimeout(promise);
}

export async function getFarmDocument<T = DocumentData>(farmId: string, subCollection: string, docId: string): Promise<T | null> {
  const docRef = doc(db, getFarmCollectionPath(farmId, subCollection), docId);
  
  try {
    const snap = !navigator.onLine ? await getDocFromCache(docRef) : await getDoc(docRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as T;
    }
  } catch (e) {
    if (navigator.onLine) {
      const snap = await getDocFromCache(docRef).catch(() => null);
      if (snap?.exists()) return { id: snap.id, ...snap.data() } as T;
    }
  }
  return null;
}

export async function getFarmDocuments<T = DocumentData>(farmId: string, subCollection: string, constraints: QueryConstraint[] = []): Promise<T[]> {
  const collRef = collection(db, getFarmCollectionPath(farmId, subCollection));
  const q = query(collRef, ...constraints);
  
  try {
    const snap = !navigator.onLine ? await getDocsFromCache(q) : await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
  } catch (e) {
    if (navigator.onLine) {
      const snap = await getDocsFromCache(q).catch(() => ({ docs: [] }));
      return snap.docs.map(d => ({ id: d.id, ...d.data() }) as T);
    }
    return [];
  }
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
