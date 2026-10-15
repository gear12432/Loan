import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';
import { UserProfile, BusinessSettings, OperationType } from '../types';

export async function createUserProfile(profileData: Omit<UserProfile, 'createdAt' | 'updatedAt'>): Promise<void> {
  const path = `users/${profileData.uid}`;
  try {
    const userRef = doc(db, 'users', profileData.uid);
    await setDoc(userRef, {
      ...profileData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Initialize business settings document concurrently
    const settingsRef = doc(db, 'businessSettings', profileData.uid);
    await setDoc(settingsRef, {
      ownerUid: profileData.uid,
      businessName: profileData.businessName,
      businessAddress: '',
      mobileNumber: profileData.mobileNumber,
      email: profileData.email,
      logoUrl: profileData.profileImageUrl || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToUserProfile(uid: string, onNext: (profile: UserProfile | null) => void, onError?: (err: any) => void) {
  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onNext(snapshot.data() as UserProfile);
      } else {
        onNext(null);
      }
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  const path = `users/${uid}`;
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    if (updates.businessName || updates.mobileNumber) {
      const settingsRef = doc(db, 'businessSettings', uid);
      await updateDoc(settingsRef, {
        ...(updates.businessName ? { businessName: updates.businessName } : {}),
        ...(updates.mobileNumber ? { mobileNumber: updates.mobileNumber } : {}),
        updatedAt: serverTimestamp(),
      }).catch(() => {
        // Ignored if settings doc was missing
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export function subscribeToBusinessSettings(uid: string, onNext: (settings: BusinessSettings | null) => void) {
  const path = `businessSettings/${uid}`;
  const settingsRef = doc(db, 'businessSettings', uid);
  return onSnapshot(
    settingsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onNext(snapshot.data() as BusinessSettings);
      } else {
        onNext(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
