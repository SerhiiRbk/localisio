'use client';

import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  showCount = false,
  count = 0,
  interactive = false,
  onChange,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const displayRating = hoverRating || rating;

  const handleClick = (value: number) => {
    if (interactive && onChange) {
      onChange(value);
    }
  };

  const handleMouseEnter = (value: number) => {
    if (interactive) {
      setHoverRating(value);
    }
  };

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {Array.from({ length: maxRating }, (_, i) => {
          const value = i + 1;
          const isFilled = value <= displayRating;
          const isHalfFilled = value - 0.5 <= displayRating && value > displayRating;

          return (
            <button
              key={i}
              type="button"
              className={`${sizes[size]} ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
              onClick={() => handleClick(value)}
              onMouseEnter={() => handleMouseEnter(value)}
              onMouseLeave={handleMouseLeave}
              disabled={!interactive}
            >
              <svg
                viewBox="0 0 24 24"
                fill={isFilled ? '#fbbf24' : 'none'}
                stroke={isFilled || isHalfFilled ? '#fbbf24' : '#d1d5db'}
                strokeWidth={2}
                className="w-full h-full"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          );
        })}
      </div>
      
      {showCount && (
        <span className={`${textSizes[size]} text-slate-500 ml-1`}>
          {rating > 0 ? rating.toFixed(1) : '—'}
          {count > 0 && ` (${count})`}
        </span>
      )}
    </div>
  );
}
