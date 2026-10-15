import { useState, useEffect, useMemo } from 'react';
import { Customer } from '../types';
import { subscribeToCustomers } from '../services/customerService';
import { getEffectiveCustomerStatus } from '../utils/frequencyHelper';

export function useCustomers(ownerUid?: string) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Pending selected by default
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'successful'>('pending');

  useEffect(() => {
    if (!ownerUid) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToCustomers(
      ownerUid,
      (data) => {
        // Map customers with dynamic effective status based on repayment frequency & date expiration
        const processedData = data.map((c) => ({
          ...c,
          status: getEffectiveCustomerStatus(c),
        }));
        setCustomers(processedData);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useCustomers Error]:', err);
        setError('Failed to load customers from Firestore.');
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [ownerUid]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Status Filter matching effective status (pending vs successful)
      if (statusFilter !== 'all' && c.status !== statusFilter) {
        return false;
      }

      // Search Query Matching across ID, Name, Mobile Number
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = c.customerId.toLowerCase().includes(q);
        const matchName = c.customerName.toLowerCase().includes(q);
        const matchMobile = c.mobileNumber.toLowerCase().includes(q);
        const matchEmail = (c.email || '').toLowerCase().includes(q);
        return matchId || matchName || matchMobile || matchEmail;
      }

      return true;
    });
  }, [customers, searchQuery, statusFilter]);

  const pendingCount = useMemo(() => customers.filter((c) => c.status === 'pending').length, [customers]);
  const successfulCount = useMemo(() => customers.filter((c) => c.status === 'successful').length, [customers]);
  const totalAmount = useMemo(() => customers.reduce((sum, c) => sum + (Number(c.amount) || 0), 0), [customers]);

  return {
    customers: filteredCustomers,
    allCustomers: customers,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    pendingCount,
    successfulCount,
    totalCount: customers.length,
    totalAmount,
  };
}
