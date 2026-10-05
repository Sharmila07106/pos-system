import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const Background = () => {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden bg-bg-color">
      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      
      {/* Aurora Blobs */}
      {theme === 'dark' ? (
        <>
          <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] rounded-full bg-blue-600/10 blur-[120px] animate-blob"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-600/10 blur-[120px] animate-blob animation-delay-2000"></div>
          <div className="absolute top-[40%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-cyan-600/10 blur-[120px] animate-blob animation-delay-4000"></div>
        </>
      ) : (
        <>
          <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] rounded-full bg-blue-400/20 blur-[120px] animate-blob"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-400/20 blur-[120px] animate-blob animation-delay-2000"></div>
        </>
      )}

      {/* Noise Texture */}
      <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-50 dark:opacity-30"></div>
    </div>
  );
};

export default Background;
