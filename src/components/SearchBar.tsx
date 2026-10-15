import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative -mt-6 px-4 z-10 max-w-md mx-auto">
      <div className="relative bg-white rounded-full shadow-lg border border-slate-100 flex items-center px-4 py-3">
        <Search className="w-5 h-5 text-slate-400 mr-2 shrink-0" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by ID, name or mobile number"
          className="w-full bg-transparent border-none text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
