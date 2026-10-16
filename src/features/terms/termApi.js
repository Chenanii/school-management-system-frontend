import { apiRequest } from '../../api.js';

export async function fetchTerms({ page, academicYearId, status }) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (academicYearId) params.set('academicYearId', academicYearId);
  if (status) params.set('status', status);
  return apiRequest(`/terms?${params}`);
}

export function fetchTerm(id) {
  return apiRequest(`/terms/${id}`);
}

export function saveTerm(id, data) {
  return apiRequest(id ? `/terms/${id}` : '/terms', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(data)
  });
}

export function updateTermStatus(id, status) {
  return apiRequest(`/terms/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export async function fetchAllPages(path) {
  const params = new URLSearchParams({ page: '1', limit: '100' });
  const firstPage = await apiRequest(`${path}?${params}`);
  const records = [...(firstPage.data || [])];
  for (let page = 2; page <= (firstPage.pagination?.totalPages || 1); page += 1) {
    params.set('page', String(page));
    const result = await apiRequest(`${path}?${params}`);
    records.push(...(result.data || []));
  }
  return records;
}

export const termStatuses = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN', label: 'Open' },
  { value: 'MARKS_REVIEW', label: 'Marks review' },
  { value: 'FINALIZED', label: 'Finalized' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'CLOSED', label: 'Closed' }
];

export const termTransitions = {
  DRAFT: ['OPEN'],
  OPEN: ['MARKS_REVIEW'],
  MARKS_REVIEW: ['OPEN', 'FINALIZED'],
  FINALIZED: ['PUBLISHED'],
  PUBLISHED: ['CLOSED'],
  CLOSED: []
};

export function termStatusLabel(status) {
  return termStatuses.find((item) => item.value === status)?.label || status;
}

export function formatTermDate(value) {
  if (!value) return '—';
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}
