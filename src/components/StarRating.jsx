import React from 'react'

const star = <path d="M12 17.3l-6.2 3.7 1.6-7.1L2 9.2l7.2-.6L12 2l2.8 6.6 7.2.6-5.4 4.7 1.6 7.1z" />

/**
 * Read-only or interactive star rating (1–5).
 *  - `value`  : current rating
 *  - `onChange(n)` : optional. If provided, stars are clickable + keyboard navigable.
 *  - `size`   : 'sm' | 'md' | 'lg'
 */
export default function StarRating({ value = 0, onChange, size = 'md', className = '' }) {
  const interactive = typeof onChange === 'function'
  const sizes = { sm: 'h-3.5 w-3.5', md: 'h-5 w-5', lg: 'h-7 w-7' }
  const cls = sizes[size] || sizes.md

  const Star = ({ n }) => {
    const filled = n <= Math.round(value)
    const inner = (
      <svg viewBox="0 0 24 24" className={cls}
        fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6"
        strokeLinecap="round" strokeLinejoin="round"
      >
        {star}
      </svg>
    )
    if (!interactive) {
      return <span className={'inline-block ' + (filled ? 'text-amber-300' : 'text-white/20')}>{inner}</span>
    }
    return (
      <button
        type="button"
        onClick={() => onChange(n)}
        aria-label={`${n} star${n === 1 ? '' : 's'}`}
        className={
          'transition transform hover:scale-110 focus:outline-none ' +
          (filled ? 'text-amber-300' : 'text-white/25 hover:text-white/45')
        }
      >
        {inner}
      </button>
    )
  }

  return (
    <div className={'inline-flex items-center gap-0.5 ' + className}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} n={n} />)}
    </div>
  )
}
