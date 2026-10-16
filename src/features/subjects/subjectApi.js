import { apiRequest } from '../../api.js';

export async function fetchAllPages(path, filters = {}) {
  const params = new URLSearchParams({ ...filters, page: '1', limit: '100' });
  const firstPage = await apiRequest(`${path}?${params}`);
  const records = [...(firstPage.data || [])];
  const totalPages = firstPage.pagination?.totalPages || 1;

  for (let page = 2; page <= totalPages; page += 1) {
    params.set('page', String(page));
    const result = await apiRequest(`${path}?${params}`);
    records.push(...(result.data || []));
  }

  return records;
}

export const subjectStatuses = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ARCHIVED', label: 'Archived' }
];
