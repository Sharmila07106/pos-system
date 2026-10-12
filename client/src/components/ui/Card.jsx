import React from 'react';

export const Card = ({
  children,
  className = '',
  hover = false,
  padding = 'p-6',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-[18px] border border-[#E3E8F0] ${padding} ${
        hover ? 'transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_6px_rgba(11,27,58,0.08),0_12px_32px_rgba(11,27,58,0.12)]' : 'shadow-[0_1px_2px_rgba(11,27,58,0.06),0_8px_24px_rgba(11,27,58,0.08)]'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const TiltCard = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`bg-white rounded-[18px] border border-[#E3E8F0] p-6 shadow-[0_1px_2px_rgba(11,27,58,0.06),0_8px_24px_rgba(11,27,58,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_16px_rgba(11,27,58,0.08),0_20px_40px_rgba(11,27,58,0.14)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const StatusPill = ({
  status = 'active', // 'active' | 'in_stock' | 'low_stock' | 'out_of_stock' | 'completed' | 'admin' | 'cashier' | string
  label,
  className = '',
}) => {
  const normalized = String(status).toLowerCase();
  
  let styles = 'bg-[#EEF2F8] text-[#53607A] border-[#E3E8F0]';
  let dotColor = '#8B96AB';
  let text = label || status;

  if (normalized === 'active' || normalized === 'in_stock' || normalized === 'completed' || normalized === 'good') {
    styles = 'bg-[#DCFCE7] text-[#16A34A] border-[#BBF7D0]';
    dotColor = '#16A34A';
    text = label || (normalized === 'in_stock' ? 'In Stock' : 'Active');
  } else if (normalized === 'low_stock' || normalized === 'warning' || normalized === 'pending') {
    styles = 'bg-[#FFF1E3] text-[#FF8A1F] border-[#FED7AA]';
    dotColor = '#FF8A1F';
    text = label || 'Low Stock';
  } else if (normalized === 'out_of_stock' || normalized === 'danger' || normalized === 'disabled' || normalized === 'inactive') {
    styles = 'bg-[#FEE2E2] text-[#E5484D] border-[#FECACA]';
    dotColor = '#E5484D';
    text = label || (normalized === 'out_of_stock' ? 'Out of Stock' : 'Disabled');
  } else if (normalized === 'admin') {
    styles = 'bg-[#EEF2F8] text-[#0B1B3A] border-[#CBD5E1]';
    dotColor = '#0B1B3A';
    text = label || 'Admin';
  } else if (normalized === 'cashier') {
    styles = 'bg-[#E2F6F3] text-[#0FA38F] border-[#A7F3D0]';
    dotColor = '#0FA38F';
    text = label || 'Cashier';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${styles} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dotColor }} />
      <span>{text}</span>
    </span>
  );
};

export const Skeleton = ({ className = '', height, width }) => {
  return (
    <div
      className={`bg-[#EEF2F8] animate-pulse rounded-[8px] ${className}`}
      style={{ height, width }}
    />
  );
};

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-[#E2F6F3] text-[#0FA38F] flex items-center justify-center mb-4">
          <Icon size={32} strokeWidth={1.75} />
        </div>
      )}
      <h3 className="text-lg font-bold text-[#0B1B3A] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#53607A] max-w-sm mb-6">{description}</p>}
      {action}
    </div>
  );
};

export default Card;
