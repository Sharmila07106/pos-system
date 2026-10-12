import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const Input = ({
  label,
  error,
  icon: Icon,
  type = 'text',
  className = '',
  id,
  required = false,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold text-[#53607A] uppercase tracking-wider flex items-center justify-between">
          <span>{label} {required && <span className="text-[#E5484D]">*</span>}</span>
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB] group-focus-within:text-[#0FA38F] transition-colors pointer-events-none">
            <Icon size={18} strokeWidth={1.75} />
          </div>
        )}
        <input
          id={inputId}
          type={type}
          required={required}
          className={`w-full bg-white border ${error ? 'border-[#E5484D] focus:ring-[#E5484D]/20' : 'border-[#E3E8F0] focus:border-[#0FA38F] focus:ring-[#0FA38F]/20'} rounded-[12px] ${Icon ? 'pl-11' : 'px-4'} pr-4 py-3 text-sm text-[#0B1B3A] placeholder-[#8B96AB] outline-none transition-all focus:ring-3 font-medium ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs font-semibold text-[#E5484D] mt-0.5">{error}</span>}
    </div>
  );
};

export const PasswordInput = ({
  label = 'Password',
  error,
  icon: Icon,
  className = '',
  id,
  ...props
}) => {
  const [show, setShow] = useState(false);
  const inputId = id || 'password-input';

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label htmlFor={inputId} className="text-xs font-bold text-[#53607A] uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB] group-focus-within:text-[#0FA38F] transition-colors pointer-events-none">
            <Icon size={18} strokeWidth={1.75} />
          </div>
        )}
        <input
          id={inputId}
          type={show ? 'text' : 'password'}
          className={`w-full bg-white border ${error ? 'border-[#E5484D] focus:ring-[#E5484D]/20' : 'border-[#E3E8F0] focus:border-[#0FA38F] focus:ring-[#0FA38F]/20'} rounded-[12px] ${Icon ? 'pl-11' : 'px-4'} pr-11 py-3 text-sm text-[#0B1B3A] placeholder-[#8B96AB] outline-none transition-all focus:ring-3 font-medium ${className}`}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow(!show)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8B96AB] hover:text-[#0B1B3A] transition-colors p-1"
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff size={18} strokeWidth={1.75} /> : <Eye size={18} strokeWidth={1.75} />}
        </button>
      </div>
      {error && <span className="text-xs font-semibold text-[#E5484D] mt-0.5">{error}</span>}
    </div>
  );
};

export default Input;
