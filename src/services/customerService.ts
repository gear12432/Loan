import {
  collection,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, handleFirestoreError } from './firebase';
import { Customer, CustomerStatus, OperationType } from '../types';
import { logCustomerHistory } from './historyService';
import { createNotification } from './notificationService';

export async function generateUniqueCustomerId(_ownerUid?: string): Promise<string> {
  const randomDigits = Math.floor(10000 + Math.random() * 90000); // 5 random numbers
  return `FG${randomDigits}`;
}

export async function addCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const path = 'customers';
  try {
    const customersRef = collection(db, 'customers');
    const docRef = await addDoc(customersRef, {
      ...customerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Log audit trail
    await logCustomerHistory({
      ownerUid: customerData.ownerUid,
      customerId: customerData.customerId,
      action: 'CREATED',
      newStatus: customerData.status,
      description: `Created new customer ${customerData.customerName} (${customerData.customerId}) with amount $${customerData.amount}`,
    });

    // Send notification
    await createNotification(
      customerData.ownerUid,
      'New Customer Added',
      `Customer ${customerData.customerName} (${customerData.customerId}) was created.`
    );

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateCustomer(docId: string, ownerUid: string, updates: Partial<Customer>): Promise<void> {
  const path = `customers/${docId}`;
  try {
    const customerRef = doc(db, 'customers', docId);
    
    // Prevent changing critical identity fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.customerId;
    delete safeUpdates.ownerUid;
    delete safeUpdates.createdAt;

    await updateDoc(customerRef, {
      ...safeUpdates,
      updatedAt: serverTimestamp(),
    });

    if (updates.customerId) {
      await logCustomerHistory({
        ownerUid,
        customerId: updates.customerId,
        action: 'UPDATED',
        description: `Updated customer information for ${updates.customerName || 'customer'}`,
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function recordCustomerPayment(
  docId: string,
  ownerUid: string,
  customerId: string,
  customerName: string,
  currentAmount: number,
  paidAmount: number
): Promise<{ remainingAmount: number; newStatus: CustomerStatus }> {
  const path = `customers/${docId}`;
  try {
    const remainingAmount = Math.max(0, currentAmount - paidAmount);
    const newStatus: CustomerStatus = 'successful';

    const customerRef = doc(db, 'customers', docId);
    await updateDoc(customerRef, {
      amount: remainingAmount,
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    await logCustomerHistory({
      ownerUid,
      customerId,
      action: 'PAYMENT_RECORDED',
      newStatus,
      description: `Payment of $${paidAmount} received. Remaining Loan: $${remainingAmount}. Status set to SUCCESSFUL.`,
    });

    await createNotification(
      ownerUid,
      'Payment Recorded & Status Updated',
      `Payment of $${paidAmount} recorded for ${customerName} (${customerId}). Remaining loan: $${remainingAmount}. Status updated to SUCCESSFUL.`
    );

    return { remainingAmount, newStatus };
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function updateCustomerStatus(
  docId: string,
  ownerUid: string,
  customerId: string,
  customerName: string,
  previousStatus: CustomerStatus,
  newStatus: CustomerStatus
): Promise<void> {
  const path = `customers/${docId}`;
  try {
    const customerRef = doc(db, 'customers', docId);
    await updateDoc(customerRef, {
      status: newStatus,
      updatedAt: serverTimestamp(),
    });

    await logCustomerHistory({
      ownerUid,
      customerId,
      action: 'STATUS_CHANGED',
      previousStatus,
      newStatus,
      description: `Status changed from ${previousStatus.toUpperCase()} to ${newStatus.toUpperCase()}`,
    });

    await createNotification(
      ownerUid,
      'Customer Status Updated',
      `${customerName} (${customerId}) status updated to ${newStatus.toUpperCase()}`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deleteCustomer(docId: string, ownerUid: string, customerId: string, customerName: string): Promise<void> {
  const path = `customers/${docId}`;
  try {
    const customerRef = doc(db, 'customers', docId);
    await deleteDoc(customerRef);

    await logCustomerHistory({
      ownerUid,
      customerId,
      action: 'DELETED',
      description: `Customer ${customerName} was deleted from database`,
    });

    await createNotification(
      ownerUid,
      'Customer Deleted',
      `Customer ${customerName} (${customerId}) has been permanently deleted.`
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export function subscribeToCustomers(ownerUid: string, onNext: (customers: Customer[]) => void, onError?: (err: any) => void) {
  const path = 'customers';
  const customersRef = collection(db, 'customers');
  const q = query(
    customersRef,
    where('ownerUid', '==', ownerUid),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const customers: Customer[] = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...(docSnap.data() as Customer),
      }));
      onNext(customers);
    },
    (error) => {
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}

export function subscribeToCustomerById(docId: string, onNext: (customer: Customer | null) => void) {
  const path = `customers/${docId}`;
  const customerRef = doc(db, 'customers', docId);
  return onSnapshot(
    customerRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onNext({ id: snapshot.id, ...(snapshot.data() as Customer) });
      } else {
        onNext(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
