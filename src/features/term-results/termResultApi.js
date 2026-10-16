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

export function fetchTermResults({ termId, classGroupId, subjectId }) {
  const params = new URLSearchParams({ termId, classGroupId, subjectId });
  return apiRequest(`/term-results?${params}`);
}

export function calculateTermResults({ termId, classGroupId, subjectId }) {
  const params = new URLSearchParams({ classGroupId, subjectId });
  return apiRequest(`/assessments/terms/${termId}/results/calculate?${params}`, { method: 'POST' });
}

export function updateTermResultsStatus({ termId, classGroupId, subjectId, status }) {
  const action = status === 'FINALIZED' ? 'finalize' : 'publish';
  return apiRequest(`/term-results/terms/${termId}/classes/${classGroupId}/subjects/${subjectId}/${action}`, {
    method: 'POST'
  });
}
