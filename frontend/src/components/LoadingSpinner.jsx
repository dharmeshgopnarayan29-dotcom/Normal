import React from 'react';

/**
 * Inline loading spinner for buttons.
 * Usage: <LoadingSpinner size={16} color="white" />
 */
const LoadingSpinner = ({ size = 16, color = 'currentColor', className = '' }) => (
    <svg
        className={`btn-spinner ${className}`}
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <circle
            cx="12" cy="12" r="10"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.25"
        />
        <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
        />
    </svg>
);

export default LoadingSpinner;
