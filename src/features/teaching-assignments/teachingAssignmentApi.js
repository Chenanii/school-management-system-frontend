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

export async function fetchAssignments({ page, teacherId, classGroupId, termId }) {
  const params = new URLSearchParams({ page: String(page), limit: '20' });
  if (teacherId) params.set('teacherId', teacherId);
  if (classGroupId) params.set('classGroupId', classGroupId);
  if (termId) params.set('termId', termId);
  return apiRequest(`/teaching-assignments?${params}`);
}

export function saveAssignment(id, data) {
  return apiRequest(id ? `/teaching-assignments/${id}` : '/teaching-assignments', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(data)
  });
}

export function deleteAssignment(id) {
  return apiRequest(`/teaching-assignments/${id}`, { method: 'DELETE' });
}

export function teacherDisplayName(teacher) {
  return [teacher?.firstName, teacher?.lastName].filter(Boolean).join(' ') || teacher?.email || 'Teacher';
}

export function formatAssignmentClass(group) {
  if (!group) return 'Subject section';
  return `${group.classLevel?.levelOrder ? `${group.classLevel.levelOrder}. ` : ''}${group.classLevel?.name || 'Class'} · ${group.name}`;
}
