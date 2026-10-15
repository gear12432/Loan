import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile, getUserProfile } from './userService';
import { UserProfile } from '../types';

export interface RegisterParams {
  fullName: string;
  businessName: string;
  mobileNumber: string;
  email: string;
  password: string;
}

export async function registerUser({ fullName, businessName, mobileNumber, email, password }: RegisterParams): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create Firestore user record
  await createUserProfile({
    uid: user.uid,
    fullName,
    businessName,
    mobileNumber,
    email,
    profileImageUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}`,
  });

  return user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export function subscribeToAuthState(onUserChanged: (user: User | null) => void) {
  return onAuthStateChanged(auth, onUserChanged);
}
