import React from 'react';

export const Button = ({
  children,
  variant = 'primary', // 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon: Icon,
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold tracking-tight transition-all duration-200 select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 active:scale-[0.98] outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs rounded-[10px] gap-1.5',
    md: 'px-4 py-2.5 text-sm rounded-[12px] gap-2',
    lg: 'px-6 py-3.5 text-base rounded-[14px] gap-2.5',
  }[size] || 'px-4 py-2.5 text-sm rounded-[12px] gap-2';

  const variantStyles = {
    primary: 'bg-[#0FA38F] hover:bg-[#0B8A78] text-white shadow-[0_2px_8px_rgba(15,163,143,0.3)] hover:shadow-[0_4px_14px_rgba(15,163,143,0.4)] focus-visible:ring-[#0FA38F]',
    secondary: 'bg-[#0B1B3A] hover:bg-[#12274F] text-white shadow-[0_2px_8px_rgba(11,27,58,0.2)] focus-visible:ring-[#0B1B3A]',
    outline: 'border border-[#E3E8F0] hover:border-[#CBD5E1] bg-white hover:bg-[#EEF2F8] text-[#0B1B3A] focus-visible:ring-[#0FA38F]',
    danger: 'bg-[#E5484D] hover:bg-[#DC2626] text-white shadow-[0_2px_8px_rgba(229,72,77,0.3)] focus-visible:ring-[#E5484D]',
    ghost: 'bg-transparent hover:bg-[#EEF2F8] text-[#53607A] hover:text-[#0B1B3A]',
  }[variant] || 'bg-[#0FA38F] text-white';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : size === 'lg' ? 20 : 18} strokeWidth={1.75} />
      ) : null}
      <span>{children}</span>
    </button>
  );
};

export default Button;
