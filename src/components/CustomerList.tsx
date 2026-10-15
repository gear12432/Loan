import React from 'react';
import { Customer } from '../types';
import { CustomerListItem } from './CustomerListItem';
import { Users, UserPlus } from 'lucide-react';

interface CustomerListProps {
  customers: Customer[];
  onViewCustomer: (id: string) => void;
  onAddNew: () => void;
  searchQuery: string;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  customers,
  onViewCustomer,
  onAddNew,
  searchQuery,
}) => {
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 mx-4 max-w-md md:mx-auto text-center border border-slate-200/80 shadow-sm space-y-4">
        <div className="w-14 h-14 bg-teal-50 text-[#079889] rounded-full flex items-center justify-center mx-auto">
          <Users className="w-7 h-7" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery ? 'No matching customers' : 'No customers found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            {searchQuery
              ? `No records found matching "${searchQuery}". Try searching by ID, name, or phone number.`
              : 'Start by creating your first small finance customer record.'}
          </p>
        </div>
        {!searchQuery && (
          <button
            onClick={onAddNew}
            className="bg-[#079889] hover:bg-[#067f72] text-white text-xs font-bold px-5 py-2.5 rounded-full shadow transition-all inline-flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add First Customer</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 max-w-md mx-auto space-y-3 pb-24">
      {customers.map((customer) => (
        <CustomerListItem
          key={customer.id || customer.customerId}
          customer={customer}
          onView={onViewCustomer}
        />
      ))}
    </div>
  );
};
