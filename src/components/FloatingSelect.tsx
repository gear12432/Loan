import React, { useState } from 'react';

interface FloatingSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  icon?: React.ReactNode;
  options: { value: string; label: string }[];
}

export const FloatingSelect: React.FC<FloatingSelectProps> = ({
  label,
  icon,
  value,
  onChange,
  onFocus,
  onBlur,
  options,
  required,
  disabled,
  className = '',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(value !== undefined && value !== null && String(value).length > 0);
  const isFloating = isFocused || hasValue;

  return (
    <div className="relative pt-2 my-1">
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
            {icon}
          </div>
        )}

        <select
          value={value}
          onChange={onChange}
          onFocus={(e) => {
            setIsFocused(true);
            if (onFocus) onFocus(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) onBlur(e);
          }}
          disabled={disabled}
          className={`w-full py-3.5 text-sm font-bold rounded-xl border transition-all duration-300 ease-in-out outline-none bg-white appearance-none cursor-pointer ${
            icon ? 'pl-10 pr-8' : 'px-4 pr-8'
          } ${
            isFocused
              ? 'border-[#079889] ring-2 ring-[#079889]/20'
              : 'border-slate-300 hover:border-slate-400'
          } ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''} ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom Chevron Down Icon */}
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none z-10">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>

        {/* Smooth Animated Floating Label to Top-Left */}
        <label
          className={`absolute pointer-events-none transition-all duration-300 ease-in-out bg-white px-1.5 rounded z-20 ${
            isFloating
              ? '-top-2.5 left-3 text-[11px] font-bold text-[#079889] shadow-2xs'
              : `top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium ${icon ? 'left-9' : 'left-3.5'}`
          }`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
    </div>
  );
};
