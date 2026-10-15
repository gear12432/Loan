import React, { useState } from 'react';

interface FloatingInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  labelColor?: string;
  borderColor?: string;
  inputTextColor?: string;
}

export const FloatingInput: React.FC<FloatingInputProps> = ({
  label,
  icon,
  value,
  onChange,
  onFocus,
  onBlur,
  type = 'text',
  placeholder,
  required,
  readOnly,
  disabled,
  className = '',
  labelColor,
  borderColor,
  inputTextColor,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = Boolean(value !== undefined && value !== null && String(value).length > 0);
  const isFloating = isFocused || hasValue;

  const activeLabelColor = labelColor || 'text-[#079889]';
  const activeBorderColor =
    borderColor ||
    (isFocused ? 'border-[#079889] ring-2 ring-[#079889]/20' : 'border-slate-300 hover:border-slate-400');
  const activeTextColor = inputTextColor || '';

  return (
    <div className="relative pt-2 my-1">
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          type={type}
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
          readOnly={readOnly}
          disabled={disabled}
          placeholder={isFocused ? placeholder : ''}
          className={`w-full py-3.5 text-sm font-medium rounded-xl border transition-all duration-300 ease-in-out outline-none bg-white ${
            icon ? 'pl-10 pr-4' : 'px-4'
          } ${activeBorderColor} ${activeTextColor} ${
            (readOnly || disabled) && !borderColor
              ? 'bg-teal-50/50 border-teal-200 text-[#079889] font-mono font-bold cursor-default'
              : ''
          } ${className}`}
          {...props}
        />

        {/* Smooth Animated Floating Label to Top-Left */}
        <label
          className={`absolute pointer-events-none transition-all duration-300 ease-in-out bg-white px-1.5 rounded z-20 ${
            isFloating
              ? `-top-2.5 left-3 text-[11px] font-bold ${activeLabelColor} shadow-2xs`
              : `top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium ${icon ? 'left-9' : 'left-3.5'}`
          }`}
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>
    </div>
  );
};
