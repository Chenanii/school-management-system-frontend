import { apiRequest } from '../../api.js';

export async function fetchAllClassLevels() {
  const params = new URLSearchParams({ page: '1', limit: '100' });
  const firstPage = await apiRequest(`/class-levels?${params}`);
  const levels = [...(firstPage.data || [])];

  for (let page = 2; page <= (firstPage.pagination?.totalPages || 1); page += 1) {
    params.set('page', String(page));
    const result = await apiRequest(`/class-levels?${params}`);
    levels.push(...(result.data || []));
  }

  return levels.sort((left, right) => left.levelOrder - right.levelOrder);
}
