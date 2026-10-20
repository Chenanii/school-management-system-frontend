import { API_BASE_URL, apiRequest, getAccessToken, getSchoolContextId } from '../../api.js';

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

export function fetchAttendanceReport({ termId, classGroupId, studentId }) {
  const params = new URLSearchParams({ termId });
  if (classGroupId) params.set('classGroupId', classGroupId);
  if (studentId) params.set('studentId', studentId);
  return apiRequest(`/attendance/reports?${params}`);
}

export async function downloadAttendanceReport({ termId, classGroupId, studentId, format }) {
  const params = new URLSearchParams({ termId, format });
  if (classGroupId) params.set('classGroupId', classGroupId);
  if (studentId) params.set('studentId', studentId);
  const headers = new Headers();
  const token = getAccessToken();
  const schoolId = getSchoolContextId();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (schoolId) headers.set('X-School-ID', schoolId);
  const response = await fetch(`${API_BASE_URL}/attendance/reports?${params}`, { headers });
  if (!response.ok) {
    let message = 'The report could not be downloaded.';
    try { message = (await response.json()).error?.message || message; } catch { /* keep fallback */ }
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }
  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const filename = disposition.match(/filename="?([^";]+)"?/i)?.[1] || `attendance-report.${format === 'excel' ? 'xls' : 'pdf'}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
