import { Star } from 'lucide-react';

export function RatingStars({
  rating,
  count,
  showCount = true,
}: {
  rating: number;
  count?: number;
  showCount?: boolean;
}) {
  const safeRating = Math.max(0, Math.min(5, rating));
  return (
    <span className="ds-stars" aria-label={`Rated ${safeRating.toFixed(1)} out of 5`}>
      <Star size={15} fill="currentColor" aria-hidden="true" />
      <strong className="tabular-nums">{safeRating.toFixed(1)}</strong>
      {showCount && typeof count === 'number' && (
        <span className="ds-muted">({count} {count === 1 ? 'review' : 'reviews'})</span>
      )}
    </span>
  );
}
