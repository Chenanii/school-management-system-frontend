import { apiRequest } from '../../api.js';

export const assessmentTypes = [
  { value: 'COURSEWORK', label: 'Coursework' },
  { value: 'MID_TERM_EXAM', label: 'Mid-term exam' },
  { value: 'FINAL_EXAM', label: 'Final exam' }
];

export const assessmentStatuses = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN', label: 'Open' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'LOCKED', label: 'Locked' }
];

export const assessmentTransitions = {
  DRAFT: 'OPEN',
  OPEN: 'SUBMITTED',
  SUBMITTED: 'APPROVED',
  APPROVED: 'LOCKED'
};

export const resultStatuses = [
  { value: 'NOT_ENTERED', label: 'Not entered' },
  { value: 'PRESENT', label: 'Present' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'EXEMPT', label: 'Exempt' }
];

export function assessmentTypeLabel(type) {
  return assessmentTypes.find((item) => item.value === type)?.label || type;
}

export function assessmentStatusLabel(status) {
  return assessmentStatuses.find((item) => item.value === status)?.label || status;
}

export function fetchAssessments(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  return apiRequest(`/assessments${params.size ? `?${params}` : ''}`);
}

export function saveAssessment(id, data) {
  return apiRequest(id ? `/assessments/${id}` : '/assessments', {
    method: id ? 'PATCH' : 'POST',
    body: JSON.stringify(data)
  });
}

export function transitionAssessment(id) {
  return apiRequest(`/assessments/${id}/transition`, { method: 'POST' });
}

export function resetAssessment(id) {
  return apiRequest(`/assessments/${id}/reset`, { method: 'POST' });
}

export function fetchAssessmentResults(id) {
  return apiRequest(`/assessments/${id}/results`);
}

export function saveAssessmentResults(id, results) {
  return apiRequest(`/assessments/${id}/results`, {
    method: 'PUT',
    body: JSON.stringify({ results })
  });
}

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

export function assessmentAssignmentLabel(assignment) {
  const group = assignment.classGroup;
  const className = [
    group?.classLevel?.levelOrder ? `${group.classLevel.levelOrder}.` : '',
    group?.classLevel?.name,
    group?.name
  ].filter(Boolean).join(' ');
  const subject = assignment.subject || assignment.classSubject?.subject;
  const teacher = assignment.teacher;
  const teacherName = [teacher?.firstName, teacher?.lastName].filter(Boolean).join(' ') || teacher?.email;
  const stream = assignment.subjectStream?.name;
  return [className, subject?.name, stream, teacherName].filter(Boolean).join(' · ');
}
