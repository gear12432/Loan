import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCustomers } from '../hooks/useCustomers';
import { useNotifications } from '../hooks/useNotifications';
import { AppHeader } from '../components/AppHeader';
import { SearchBar } from '../components/SearchBar';
import { StatusFilter } from '../components/StatusFilter';
import { CustomerList } from '../components/CustomerList';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { AlertTriangle } from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const {
    customers,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    pendingCount,
    successfulCount,
    totalCount,
  } = useCustomers(user?.uid);

  const { unreadCount } = useNotifications(user?.uid);

  return (
    <div className="min-h-screen bg-[#EDF1F7] pb-10">
      {/* 1. Header with brand title, profile avatar and notification bell */}
      <AppHeader
        profile={profile}
        unreadNotificationsCount={unreadCount}
      />

      {/* 2. Overlapping Search Bar */}
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {/* 3. Create New Customer Row & Status Filter (Pending selected by default) */}
      <StatusFilter
        pendingCount={pendingCount}
        successfulCount={successfulCount}
        totalCount={totalCount}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        onAddNew={() => navigate('/add-customer')}
      />

      {/* 4. Error Banner */}
      {error && (
        <div className="px-4 max-w-md mx-auto mb-4">
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-2xl flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* 5. Customer List with real-time onSnapshot sync */}
      {loading ? (
        <LoadingIndicator message="Listening to real-time Firestore updates..." />
      ) : (
        <CustomerList
          customers={customers}
          onViewCustomer={(id) => navigate(`/customer/${id}`)}
          onAddNew={() => navigate('/add-customer')}
          searchQuery={searchQuery}
        />
      )}
    </div>
  );
};
