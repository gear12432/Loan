import React from 'react';
import { Plus } from 'lucide-react';

interface StatusFilterProps {
  pendingCount: number;
  successfulCount: number;
  totalCount: number;
  activeFilter: 'all' | 'pending' | 'successful';
  onFilterChange: (filter: 'all' | 'pending' | 'successful') => void;
  onAddNew: () => void;
}

export const StatusFilter: React.FC<StatusFilterProps> = ({
  pendingCount,
  successfulCount,
  totalCount,
  activeFilter,
  onFilterChange,
  onAddNew,
}) => {
  return (
    <div className="px-4 mt-5 mb-4 max-w-md mx-auto space-y-4">
      {/* Create New Customer Row */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-900">Create New Customer</h2>
        <button
          onClick={onAddNew}
          className="bg-[#079889] hover:bg-[#067f72] text-white text-sm font-semibold px-4 py-2 rounded-full shadow-sm flex items-center space-x-1 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Now</span>
        </button>
      </div>

      {/* Status Summary & Quick Filters */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-200/60 flex items-center justify-between">
        <button
          onClick={() => onFilterChange('pending')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-2 rounded-xl transition-all ${
            activeFilter === 'pending'
              ? 'bg-amber-50 ring-2 ring-[#F39A00]'
              : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-3.5 h-3.5 rounded-full bg-[#F39A00] shrink-0" />
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Pending ({pendingCount})
          </span>
        </button>

        <div className="w-[1px] h-6 bg-slate-200 mx-1" />

        <button
          onClick={() => onFilterChange('successful')}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 px-2 rounded-xl transition-all ${
            activeFilter === 'successful'
              ? 'bg-emerald-50 ring-2 ring-[#176B2C]'
              : 'hover:bg-slate-50'
          }`}
        >
          <span className="w-3.5 h-3.5 rounded-full bg-[#176B2C] shrink-0" />
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            Successful ({successfulCount})
          </span>
        </button>

        <div className="w-[1px] h-6 bg-slate-200 mx-1" />

        <button
          onClick={() => onFilterChange('all')}
          className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            activeFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All ({totalCount})
        </button>
      </div>
    </div>
  );
};
