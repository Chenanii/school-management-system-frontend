import { apiRequest } from '../../api.js';

async function fetchAllPages(path) {
  const params = new URLSearchParams({ page: '1', limit: '100' });
  const first = await apiRequest(`${path}?${params}`);
  const rows = [...(first.data || [])];
  for (let page = 2; page <= (first.pagination?.totalPages || 1); page += 1) {
    params.set('page', String(page));
    const result = await apiRequest(`${path}?${params}`);
    rows.push(...(result.data || []));
  }
  return rows;
}

export function fetchAttendanceTerms() {
  return fetchAllPages('/terms');
}

export function fetchAttendanceClasses(termId, date) {
  const params = new URLSearchParams({ termId, date });
  return apiRequest(`/attendance/classes?${params}`);
}

export function fetchAttendanceSheet({ termId, classGroupId, date }) {
  const params = new URLSearchParams({ termId, classGroupId, date });
  return apiRequest(`/attendance/sheet?${params}`);
}

export function saveAttendanceSheet(data) {
  return apiRequest('/attendance/sheet', { method: 'PUT', body: JSON.stringify(data) });
}
