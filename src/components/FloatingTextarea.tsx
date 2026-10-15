import React, { useState } from 'react';

interface FloatingTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  icon?: React.ReactNode;
}

export const FloatingTextarea: React.FC<FloatingTextareaProps> = ({
  label,
  icon,
  value,
  onChange,
  onFocus,
  onBlur,
  rows = 3,
  placeholder,
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
      <div className="relative flex items-start">
        {icon && (
          <div className="absolute left-3.5 top-3.5 text-slate-400 z-10 pointer-events-none">
            {icon}
          </div>
        )}

        <textarea
          rows={rows}
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
          placeholder={isFocused ? placeholder : ''}
          className={`w-full py-3.5 text-sm font-medium rounded-xl border transition-all duration-300 ease-in-out outline-none bg-white ${
            icon ? 'pl-10 pr-4' : 'px-4'
          } ${
            isFocused
              ? 'border-[#079889] ring-2 ring-[#079889]/20'
              : 'border-slate-300 hover:border-slate-400'
          } ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-75' : ''} ${className}`}
          {...props}
        />

        {/* Smooth Animated Floating Label to Top-Left */}
        <label
          className={`absolute pointer-events-none transition-all duration-300 ease-in-out bg-white px-1.5 rounded z-20 ${
            isFloating
              ? '-top-2.5 left-3 text-[11px] font-bold text-[#079889] shadow-2xs'
              : `top-3.5 text-slate-400 text-sm font-medium ${icon ? 'left-9' : 'left-3.5'}`
          }`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
    </div>
  );
};
