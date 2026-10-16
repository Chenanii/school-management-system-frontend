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

export function fetchPromotionPreview(scope) {
  const params = new URLSearchParams(scope);
  return apiRequest(`/promotions/preview?${params}`);
}

export function savePromotionPolicy(classLevelId, policy) {
  return apiRequest(`/promotions/policies/${classLevelId}`, {
    method: 'PUT',
    body: JSON.stringify(policy)
  });
}

export function approvePromotion(scope, decisions) {
  return apiRequest('/promotions/approve', {
    method: 'POST',
    body: JSON.stringify({ ...scope, decisions })
  });
}

export function fetchPromotionBatch(id) {
  return apiRequest(`/promotions/batches/${id}`);
}
