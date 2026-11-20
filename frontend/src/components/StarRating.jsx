import React from 'react';

// Star rating display and interactive selector
export default function StarRating({ value = 0, onChange = null, max = 5, size = 'md' }) {
  const stars = [];

  for (let i = 1; i <= max; i++) {
    const isFilled = i <= Math.round(value);
    stars.push(
      <span
        key={i}
        className={`star ${isFilled ? 'filled' : 'empty'} ${onChange ? 'interactive' : ''} size-${size}`}
        onClick={() => onChange && onChange(i)}
        title={onChange ? `Rate ${i} star${i > 1 ? 's' : ''}` : `${value} / 5`}
      >
        ★
      </span>
    );
  }

  return (
    <div className="star-rating-container">
      <div className="stars-row">{stars}</div>
      {value > 0 && <span className="rating-number">({value})</span>}
      {value === 0 && !onChange && <span className="rating-number muted">(Not rated)</span>}
    </div>
  );
}
