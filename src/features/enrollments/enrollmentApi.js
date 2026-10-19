
import { apiRequest } from '../../api.js';

/** Fetch every page of a list endpoint (100 per page). Extra query params are optional. */
export async function fetchAllPages(path, extra = {}) {
  const params = new URLSearchParams({ page: '1', limit: '100' });
  Object.entries(extra).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const first = await apiRequest(`${path}?${params}`);
  const records = [...(first.data || [])];
  for (let page = 2; page <= (first.pagination?.totalPages || 1); page += 1) {
    params.set('page', String(page));
    const result = await apiRequest(`${path}?${params}`);
    records.push(...(result.data || []));
  }
  return records;
}

function enrollmentParams({ page = 1, limit = 20, termId, classGroupId, classLevelId, unassigned, status, search, studentId }) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (studentId) params.set('studentId', studentId);
  if (termId) params.set('termId', termId);
  if (classGroupId) params.set('classGroupId', classGroupId);
  if (classLevelId) params.set('classLevelId', classLevelId);
  if (unassigned) params.set('unassigned', 'true');
  if (status) params.set('status', status);
  if (search?.trim()) params.set('search', search.trim());
  return params;
}

export function fetchEnrollments(filters) {
  return apiRequest(`/enrollments?${enrollmentParams(filters)}`);
}

/** Loads all enrollments matching the filters (used by the class group assignment screen). */
export async function fetchAllEnrollments(filters) {
  const records = [];
  let totalPages = 1;
  for (let page = 1; page <= totalPages; page += 1) {
    const result = await apiRequest(`/enrollments?${enrollmentParams({ ...filters, page, limit: 100 })}`);
    records.push(...(result.data || []));
    totalPages = result.pagination?.totalPages || 1;
  }
  return records;
}

export function fetchStudents(search = '', excludeEnrolledTermId = '', page = 1) {
  const params = new URLSearchParams({ page: String(page), limit: '20', status: 'ACTIVE' });
  if (search.trim()) params.set('search', search.trim());
  if (excludeEnrolledTermId) params.set('excludeEnrolledTermId', excludeEnrolledTermId);
  return apiRequest(`/students?${params}`);
}

export function fetchStudentEnrollments(studentId) {
  return apiRequest(`/enrollments?page=1&limit=100&studentId=${encodeURIComponent(studentId)}`);
}

export function createEnrollment(data) {
  return apiRequest('/enrollments', { method: 'POST', body: JSON.stringify(data) });
}

export function updateEnrollmentStatus(id, status) {
  return apiRequest(`/enrollments/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
}

export function updateEnrollmentClassGroup(id, classGroupId) {
  return apiRequest(`/enrollments/${id}/class-group`, { method: 'PATCH', body: JSON.stringify({ classGroupId }) });
}

/** Assign many existing enrollments (same term) to one class group. */
export function assignClassGroupBulk({ termId, classGroupId, enrollmentIds }) {
  return apiRequest('/enrollments/assign-class-group', {
    method: 'POST',
    body: JSON.stringify({ termId, classGroupId, enrollmentIds })
  });
}

export function fetchSubjectStreamRoster(assignmentId) {
  return apiRequest(`/teaching-assignments/${assignmentId}/student-streams`);
}

export function saveSubjectStreamRoster(assignmentId, enrollmentIds) {
  return apiRequest(`/teaching-assignments/${assignmentId}/student-streams`, {
    method: 'PUT',
    body: JSON.stringify({ enrollmentIds })
  });
}

export function previewBulkEnrollment(data) {
  return apiRequest('/enrollments/bulk/preview', { method: 'POST', body: JSON.stringify(data) });
}

export function createBulkEnrollments(data) {
  return apiRequest('/enrollments/bulk', { method: 'POST', body: JSON.stringify({ ...data, confirm: true }) });
}

export function previewSelectedBulkEnrollment(data) {
  return apiRequest('/enrollments/bulk/selected/preview', { method: 'POST', body: JSON.stringify(data) });
}

export function createSelectedBulkEnrollments(data) {
  return apiRequest('/enrollments/bulk/selected', { method: 'POST', body: JSON.stringify(data) });
}