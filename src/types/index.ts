import { Timestamp } from 'firebase/firestore';

export type CustomerStatus = 'pending' | 'successful';
export type PaymentFrequency = 'daily' | 'weekly' | 'monthly';

export interface UserProfile {
  uid: string;
  fullName: string;
  businessName: string;
  mobileNumber: string;
  email: string;
  profileImageUrl?: string;
  createdAt: Timestamp | string | Date;
  updatedAt?: Timestamp | string | Date;
}

export interface Customer {
  id?: string;
  customerId: string;
  ownerUid: string;
  customerName: string;
  mobileNumber: string;
  amount: number;
  principalAmount?: number;
  interestAmount?: number;
  loanDate?: string;
  loanTime?: string;
  frequency?: PaymentFrequency;
  email?: string;
  address?: string;
  profileImageUrl?: string;
  referenceName?: string;
  description?: string;
  status: CustomerStatus;
  notes?: string;
  createdAt: Timestamp | string | Date;
  updatedAt?: Timestamp | string | Date;
}

export interface AppNotification {
  id?: string;
  notificationId: string;
  ownerUid: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Timestamp | string | Date;
}

export interface CustomerHistoryItem {
  id?: string;
  historyId: string;
  ownerUid: string;
  customerId: string;
  action: string;
  previousStatus?: string;
  newStatus?: string;
  description: string;
  createdAt: Timestamp | string | Date;
}

export interface BusinessSettings {
  ownerUid: string;
  businessName: string;
  businessAddress: string;
  mobileNumber: string;
  email: string;
  logoUrl?: string;
  createdAt: Timestamp | string | Date;
  updatedAt?: Timestamp | string | Date;
}

export interface CustomerTransaction {
  id?: string;
  transactionId: string;
  ownerUid: string;
  customerId: string;
  amount: number;
  transactionType: 'payment' | 'charge' | 'credit' | 'debit';
  description: string;
  transactionDate: string;
  createdAt: Timestamp | string | Date;
  updatedAt?: Timestamp | string | Date;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}
