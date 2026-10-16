import { apiRequest } from '../../api.js';

export async function fetchAcademicYears(page) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  return apiRequest(`/academic-years?${params}`);
}

export function fetchAcademicYear(id) {
  return apiRequest(`/academic-years/${id}`);
}

export async function fetchGradeScales() {
  const result = await apiRequest('/grade-scales');
  return result.data || [];
}

export function createGradeScale(data) {
  return apiRequest('/grade-scales', { method: 'POST', body: JSON.stringify(data) });
}

export function saveAcademicYear(id, data) {
  return apiRequest(id ? `/academic-years/${id}` : '/academic-years', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(data)
  });
}

export function formatAcademicDate(value) {
  if (!value) return '—';
  const datePart = String(value).slice(0, 10);
  const date = new Date(`${datePart}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

export function academicYearStatus(year) {
  const today = new Date().toISOString().slice(0, 10);
  const starts = String(year.startDate).slice(0, 10);
  const ends = String(year.endDate).slice(0, 10);
  if (year.isCurrent) return 'Current';
  if (today < starts) return 'Upcoming';
  if (today > ends) return 'Ended';
  return 'In progress';
}
