import { Customer, CustomerStatus } from '../types';

/**
 * Calculates the effective customer status based on repayment frequency and dates.
 * - Daily ('daily'): If 1 or more calendar days have passed since the last update/loan date, status becomes 'pending'.
 * - Weekly ('weekly'): If 7 or more days have passed, status becomes 'pending'.
 * - Monthly ('monthly'): If 30 or more days have passed, status becomes 'pending'.
 */
export function getEffectiveCustomerStatus(customer: Customer): CustomerStatus {
  // If already pending, it remains pending
  if (customer.status === 'pending') {
    return 'pending';
  }

  const frequency = customer.frequency || 'daily';

  // Determine last relevant payment or loan date
  let lastDateStr = customer.loanDate;
  if (customer.updatedAt) {
    const ts = customer.updatedAt as any;
    if (ts?.seconds) {
      lastDateStr = new Date(ts.seconds * 1000).toISOString().split('T')[0];
    } else if (ts instanceof Date) {
      lastDateStr = ts.toISOString().split('T')[0];
    } else if (typeof ts === 'string') {
      lastDateStr = ts.split('T')[0];
    }
  }

  if (!lastDateStr) {
    return customer.status;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDate = new Date(lastDateStr);
  lastDate.setHours(0, 0, 0, 0);

  // Time difference in days
  const diffTime = today.getTime() - lastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (frequency === 'daily' && diffDays >= 1) {
    // Next day (e.g. 02/01/2026 vs 01/01/2026) -> Expired, set to Pending
    return 'pending';
  }

  if (frequency === 'weekly' && diffDays >= 7) {
    // 7 days elapsed -> Expired, set to Pending
    return 'pending';
  }

  if (frequency === 'monthly' && diffDays >= 30) {
    // 30 days elapsed -> Expired, set to Pending
    return 'pending';
  }

  return customer.status;
}
