import React from 'react';

export const StoreFlowIcon = ({ size = 36, className = '' }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="sfTileGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#14C4AD" />
          <stop offset="100%" stopColor="#0B8A78" />
        </linearGradient>
      </defs>
      {/* Rounded tile */}
      <rect width="48" height="48" rx="12" fill="url(#sfTileGrad)" />
      
      {/* Shopping bag body */}
      <path 
        d="M13 19C13 17.8954 13.8954 17 15 17H33C34.1046 17 35 17.8954 35 19L36.5 35C36.5 36.6569 35.1569 38 33.5 38H14.5C12.8431 38 11.5 36.6569 11.5 35L13 19Z" 
        fill="white" 
      />
      
      {/* Handle drawn as a bold checkmark */}
      <path 
        d="M19 19V14C19 11.2386 21.2386 9 24 9C26.7614 9 29 11.2386 29 14V19" 
        stroke="#0FA38F" 
        strokeWidth="3.2" 
        strokeLinecap="round" 
      />
      <path 
        d="M20 28L23 31L28 24" 
        stroke="#0B8A78" 
        strokeWidth="2.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};

export const StoreFlowLogo = ({ size = 36, variant = 'dark', className = '' }) => {
  const isDarkBg = variant === 'light'; // Text looks light when used on dark background
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <StoreFlowIcon size={size} />
      <div className="flex items-center tracking-tight leading-none">
        <span 
          style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            fontWeight: 800,
            fontSize: `${size * 0.62}px`,
            color: isDarkBg ? '#FFFFFF' : '#0B1B3A' 
          }}
        >
          Store
        </span>
        <span 
          style={{ 
            fontFamily: "'Plus Jakarta Sans', sans-serif", 
            fontWeight: 800,
            fontSize: `${size * 0.62}px`,
            color: '#0FA38F' 
          }}
        >
          Flow
        </span>
        <span 
          style={{
            fontSize: `${Math.max(size * 0.3, 10)}px`,
            fontWeight: 700,
            backgroundColor: '#FFF1E3',
            color: '#FF8A1F',
            borderRadius: '6px',
            padding: '2px 5px',
            marginLeft: '6px',
            lineHeight: 1
          }}
        >
          POS
        </span>
      </div>
    </div>
  );
};

export default StoreFlowLogo;
