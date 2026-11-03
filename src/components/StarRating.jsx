import { useState } from 'react'

// Cinco estrellas. Con `onChange` se puede puntuar (pulsar la nota actual la quita);
// sin él solo muestra `value`, que puede tener decimales (p. ej. una media).
export default function StarRating({ value, onChange, disabled, size = 'md' }) {
  const [hover, setHover] = useState(null)
  const shown = hover ?? value ?? 0

  if (!onChange) {
    return (
      <span className={`stars ${size}`} role="img" aria-label={`${(value ?? 0).toFixed(1)} de 5 estrellas`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="star" style={{ '--fill': `${Math.max(0, Math.min(1, shown - n + 1)) * 100}%` }}>★</span>
        ))}
      </span>
    )
  }

  return (
    <span className={`stars ${size} interactive`} onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="star"
          style={{ '--fill': n <= shown ? '100%' : '0%' }}
          disabled={disabled}
          aria-label={`${n} estrella${n > 1 ? 's' : ''}`}
          aria-pressed={value === n}
          onMouseEnter={() => setHover(n)}
          onClick={() => onChange(value === n ? null : n)}
        >★</button>
      ))}
    </span>
  )
}
