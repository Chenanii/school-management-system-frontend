export function initials(person) {
  return [person?.firstName, person?.lastName]
    .filter(Boolean)
    .map((name) => name[0])
    .join('')
    .toUpperCase();
}

export function formatName(person) {
  return [person.firstName, person.middleName, person.lastName]
    .filter(Boolean)
    .join(' ');
}

export function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date);
}
