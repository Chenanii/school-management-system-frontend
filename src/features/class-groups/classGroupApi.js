import { apiRequest } from '../../api.js';

export async function fetchAllPages(path, filters = {}) {
  const params = new URLSearchParams({ ...filters, page: '1', limit: '100' });
  const firstPage = await apiRequest(`${path}?${params}`);
  const records = [...(firstPage.data || [])];

  for (let page = 2; page <= (firstPage.pagination?.totalPages || 1); page += 1) {
    params.set('page', String(page));
    const result = await apiRequest(`${path}?${params}`);
    records.push(...(result.data || []));
  }

  return records;
}

export function formatClassLevel(level) {
  return `${level.levelOrder}. ${level.name}`;
}
