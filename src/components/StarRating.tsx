import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  onChange?: (value: number) => void;
  size?: 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  color?: string;
}

export function StarRating({ value, onChange, size = 'md', readOnly = false, color = '#f59e0b' }: StarRatingProps) {
  const [hover, setHover] = useState(0);
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' };

  return (
    <div className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = (hover || value) >= star;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            onClick={() => onChange?.(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(0)}
            className={`star-input ${readOnly ? 'cursor-default' : ''}`}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <Star
              className={`${sizes[size]} ${filled ? 'fill-current' : 'fill-none'}`}
              style={{ color: filled ? color : '#d1d5db' }}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
