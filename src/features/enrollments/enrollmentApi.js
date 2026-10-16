import { apiRequest } from '../../api.js';

export async function fetchAllPages(path) {
  const params = new URLSearchParams({ page: '1', limit: '100' });
  const first = await apiRequest(`${path}?${params}`);
  const records = [...(first.data || [])];
  for (let page = 2; page <= (first.pagination?.totalPages || 1); page += 1) {
    params.set('page', String(page));
    const result = await apiRequest(`${path}?${params}`);
    records.push(...(result.data || []));
  }
  return records;
}

export function fetchEnrollments({ page, limit = 20, termId, classGroupId, status, search }) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (termId) params.set('termId', termId);
  if (classGroupId) params.set('classGroupId', classGroupId);
  if (status) params.set('status', status);
  if (search?.trim()) params.set('search', search.trim());
  return apiRequest(`/enrollments?${params}`);
}

export function fetchStudents(search = '') {
  const params = new URLSearchParams({ page: '1', limit: '100' });
  if (search.trim()) params.set('search', search.trim());
  return apiRequest(`/students?${params}`);
}

export function fetchStudentEnrollments(studentId) {
  return apiRequest(`/enrollments?page=1&limit=100&studentId=${encodeURIComponent(studentId)}`);
}

export function createEnrollment(data) {
  return apiRequest('/enrollments', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function updateEnrollmentStatus(id, status) {
  return apiRequest(`/enrollments/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status })
  });
}

export function previewBulkEnrollment(data) {
  return apiRequest('/enrollments/bulk/preview', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export function createBulkEnrollments(data) {
  return apiRequest('/enrollments/bulk', {
    method: 'POST',
    body: JSON.stringify({ ...data, confirm: true })
  });
}
