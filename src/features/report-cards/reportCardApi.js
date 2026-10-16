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

export async function fetchTermEnrollments(termId, classGroupId) {
  const params = new URLSearchParams({ termId, classGroupId, page: '1', limit: '100' });
  const first = await apiRequest(`/enrollments?${params}`);
  const records = [...(first.data || [])];
  for (let page = 2; page <= (first.pagination?.totalPages || 1); page += 1) {
    params.set('page', String(page));
    const result = await apiRequest(`/enrollments?${params}`);
    records.push(...(result.data || []));
  }
  return records;
}

export function fetchReportCard(enrollmentId) {
  return apiRequest(`/report-cards/enrollments/${enrollmentId}`);
}
