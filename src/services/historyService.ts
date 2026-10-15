import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';
import { CustomerHistoryItem, OperationType } from '../types';

export async function logCustomerHistory(historyData: {
  ownerUid: string;
  customerId: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  description: string;
}): Promise<void> {
  const path = 'customerHistory';
  try {
    const historyRef = collection(db, 'customerHistory');
    const historyId = `HIST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await addDoc(historyRef, {
      historyId,
      ...historyData,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToCustomerHistory(
  ownerUid: string,
  customerId: string,
  onNext: (items: CustomerHistoryItem[]) => void
) {
  const path = 'customerHistory';
  const historyRef = collection(db, 'customerHistory');
  const q = query(
    historyRef,
    where('ownerUid', '==', ownerUid),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: CustomerHistoryItem[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as CustomerHistoryItem),
      }));
      onNext(items);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
