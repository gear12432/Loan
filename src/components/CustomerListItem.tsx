import React from 'react';
import { Customer } from '../types';
import { ChevronRight, Phone } from 'lucide-react';

interface CustomerListItemProps {
  customer: Customer;
  onView: (id: string) => void;
}

export const CustomerListItem: React.FC<CustomerListItemProps> = ({ customer, onView }) => {
  const isPending = customer.status === 'pending';

  const frequencyLabel = customer.frequency
    ? customer.frequency === 'daily'
      ? 'Per Day'
      : customer.frequency === 'weekly'
      ? 'Per Week'
      : 'Per Month'
    : null;

  return (
    <div
      onClick={() => customer.id && onView(customer.id)}
      className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
    >
      <div className="flex items-center space-x-3 min-w-0 flex-1">
        {/* Circular Profile Picture */}
        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0">
          {customer.profileImageUrl ? (
            <img
              src={customer.profileImageUrl}
              alt={customer.customerName}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-base font-bold text-[#079889]">
              {customer.customerName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Name, ID, Mobile, Amount (Rupees ₹), Frequency */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-2">
            <h3 className="text-sm font-bold text-slate-900 truncate">
              {customer.customerName}
            </h3>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shrink-0 ${
                isPending ? 'bg-[#F39A00]' : 'bg-[#176B2C]'
              }`}
            >
              {customer.status}
            </span>
          </div>

          <div className="flex items-center space-x-2 mt-0.5 text-xs text-slate-500 font-mono">
            <span className="font-bold text-[#079889]">ID: {customer.customerId}</span>
            <span>•</span>
            <span className="flex items-center text-slate-800 font-sans font-extrabold">
              ₹{Number(customer.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="flex items-center space-x-2 mt-1 text-[11px] text-slate-500">
            {customer.mobileNumber && (
              <div className="flex items-center space-x-1">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="truncate">{customer.mobileNumber}</span>
              </div>
            )}
            {frequencyLabel && (
              <span className="bg-teal-50 text-[#079889] text-[10px] font-bold px-1.5 py-0.5 rounded-md border border-teal-200">
                {frequencyLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* View Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (customer.id) onView(customer.id);
        }}
        className="ml-3 bg-slate-100 hover:bg-[#079889] hover:text-white text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl transition-all flex items-center space-x-1 shrink-0 group-hover:bg-[#079889] group-hover:text-white"
      >
        <span>View</span>
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
