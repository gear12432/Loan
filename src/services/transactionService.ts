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
import { CustomerTransaction, OperationType } from '../types';

export async function addCustomerTransaction(transactionData: {
  ownerUid: string;
  customerId: string;
  amount: number;
  transactionType: 'payment' | 'charge' | 'credit' | 'debit';
  description: string;
  transactionDate: string;
}): Promise<string> {
  const path = 'customerTransactions';
  try {
    const txRef = collection(db, 'customerTransactions');
    const transactionId = `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const docRef = await addDoc(txRef, {
      transactionId,
      ...transactionData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToCustomerTransactions(
  ownerUid: string,
  customerId: string,
  onNext: (transactions: CustomerTransaction[]) => void
) {
  const path = 'customerTransactions';
  const txRef = collection(db, 'customerTransactions');
  const q = query(
    txRef,
    where('ownerUid', '==', ownerUid),
    where('customerId', '==', customerId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const transactions: CustomerTransaction[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as CustomerTransaction),
      }));
      onNext(transactions);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeAllUserTransactions(
  ownerUid: string,
  onNext: (transactions: CustomerTransaction[]) => void
) {
  const path = 'customerTransactions';
  const txRef = collection(db, 'customerTransactions');
  const q = query(
    txRef,
    where('ownerUid', '==', ownerUid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const transactions: CustomerTransaction[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as CustomerTransaction),
      }));
      onNext(transactions);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
