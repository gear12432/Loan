import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  getDocs,
  writeBatch,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';
import { AppNotification, OperationType } from '../types';

export async function createNotification(ownerUid: string, title: string, message: string): Promise<void> {
  const path = 'notifications';
  try {
    const notifRef = collection(db, 'notifications');
    const notificationId = `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await addDoc(notifRef, {
      notificationId,
      ownerUid,
      title,
      message,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export function subscribeToNotifications(ownerUid: string, onNext: (notifications: AppNotification[]) => void) {
  const path = 'notifications';
  const notifRef = collection(db, 'notifications');
  const q = query(notifRef, where('ownerUid', '==', ownerUid), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const notifications: AppNotification[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as AppNotification),
      }));
      onNext(notifications);
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function markNotificationAsRead(docId: string): Promise<void> {
  const path = `notifications/${docId}`;
  try {
    const notifRef = doc(db, 'notifications', docId);
    await updateDoc(notifRef, { isRead: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function markAllNotificationsAsRead(ownerUid: string): Promise<void> {
  const path = 'notifications';
  try {
    const notifRef = collection(db, 'notifications');
    const q = query(notifRef, where('ownerUid', '==', ownerUid), where('isRead', '==', false));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { isRead: true });
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
