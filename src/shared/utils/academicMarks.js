export function formatAcademicMark(value, scoreOutOf = 100) {
  if (value == null || !Number.isFinite(Number(value))) return '—';
  const score = Number(value) * Number(scoreOutOf) / 100;
  return scoreOutOf === 100
    ? `${score.toFixed(2)}%`
    : `${score.toFixed(2)} / ${scoreOutOf}`;
}
