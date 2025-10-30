import React from 'react';

const Spinner: React.FC<{ size?: string; className?: string }> = ({ size = 'h-5 w-5', className = '' }) => {
  return (
    <div
      className={`animate-spin rounded-full ${size} border-white border-2 border-t-transparent ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;